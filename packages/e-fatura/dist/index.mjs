import * as https from 'node:https';
import * as crypto from 'node:crypto';
import * as qs from 'node:querystring';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { v1 } from 'uuid';
import deepMerge from 'lodash.merge';
import numberToText from 'number-to-text';
import 'number-to-text/converters/tr.js';
import { spawn } from 'node:child_process';
import axios from 'axios';

function toArray(value) {
    return [].concat(value);
}

async function tmpFileAsync() {
    const { file } = await import('tmp');
    return new Promise((resolve, reject) => {
        file((error, name, fd, cleanup) => {
            if (error) {
                return reject(error);
            }
            resolve({
                fd,
                name,
                cleanup
            });
        });
    });
}

function isPlainObject(value) {
    return value != null && Object.getPrototypeOf(value) === Object.prototype;
}

class EInvoiceError extends Error {
}

class EInvoiceApiError extends EInvoiceError {
    response;
    constructor(message, response) {
        super(message);
        this.response = response;
    }
    get name() {
        return EInvoiceApiError.name;
    }
    get errorCode() {
        return this.response.errorCode;
    }
}

class EInvoiceTypeError extends EInvoiceError {
    get name() {
        return EInvoiceTypeError.name;
    }
}

class EInvoiceMissingTokenError extends EInvoiceError {
    get name() {
        return EInvoiceMissingTokenError.name;
    }
}

class EInvoiceMissingCredentialsError extends EInvoiceError {
    credentials;
    constructor(message, credentials) {
        super(message);
        this.credentials = credentials;
    }
    get name() {
        return EInvoiceMissingCredentialsError.name;
    }
}

const DATE_FORMAT_PATTERN = /^(\d{2}\/\d{2}\/\d{4}|\d{2}:\d{2}:\d{2})$/;
function getDateFormat(value, format = 'date') {
    let date;
    if (typeof value === 'string') {
        if (DATE_FORMAT_PATTERN.test(value)) {
            return value;
        }
        date = new Date(value);
    }
    else if (value instanceof Date) {
        date = value;
    }
    else {
        date = new Date();
    }
    if (date.toString() === 'Invalid Date') {
        throw new EInvoiceTypeError('Geçersiz tarih formatı.');
    }
    if (format === 'date') {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

async function htmlToPdf(html, options) {
    const { args = ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox'], ...pdfOptions } = options || {};
    const { launch: launchBrowser } = await import('puppeteer-core');
    const browser = await launchBrowser({
        args,
        timeout: 5_000,
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ||
            process.env.CHROME_BIN ||
            '/usr/bin/chromium-browser'
    });
    const page = await browser.newPage();
    await page.setContent(html, {
        waitUntil: 'domcontentloaded'
    });
    try {
        const pdfBytes = await page.pdf({
            format: 'A4',
            ...pdfOptions,
            path: undefined
        });
        return Buffer.from(pdfBytes);
        // eslint-disable-next-line no-useless-catch
    }
    catch (err) {
        throw err;
    }
    finally {
        await browser.close();
    }
}

function stringValidator(value, field) {
    if (typeof value !== 'string') {
        throw new EInvoiceTypeError([
            `"${field}" alanı dizi (string) türünde bir değere sahip olmalıdır.`,
            `(Sağlanan değer: "${value}").`
        ].join(' '));
    }
}
function notEmptyStringValidator(value, field) {
    stringValidator(value, field);
    if (value === '') {
        throw new EInvoiceTypeError(`"${field}" alanı boş bir dizi (string) olamaz.`);
    }
}
function greaterThanValidator(value, than, field) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= than) {
        throw new EInvoiceTypeError(`"${field}" alanı ${than}'dan büyük olmalıdır.`);
    }
}

function formatCase(value, caseOption) {
    switch (caseOption) {
        case 'upperCase':
            return value.toUpperCase();
        case 'lowerCase':
            return value.toLowerCase();
        case 'titleCase':
            value = value.toLowerCase();
            return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
        default:
            return value.toUpperCase();
    }
}
function paymentPriceToText(paymentPrice, options) {
    greaterThanValidator(paymentPrice, 0, 'paymentPrice');
    const [main, sub] = paymentPrice.toFixed(2).split('.');
    const { spaces = false, language = 'tr', case: caseOption = 'upperCase', separator } = options || {};
    const mainText = numberToText.convertToText(+main, {
        case: caseOption,
        language,
        separator
    });
    const texts = [
        spaces ? mainText : mainText.replace(/\s/g, ''),
        formatCase('TL', caseOption)
    ];
    if (sub !== '00') {
        const subText = numberToText.convertToText(+sub, {
            case: caseOption,
            language,
            separator
        });
        texts.push(spaces ? subText : subText.replace(/\s/g, ''), formatCase('KRŞ.', caseOption));
    }
    return texts.join(' ').trim();
}

function mappingInvoiceKeys(value) {
    if (!isPlainObject(value)) {
        throw new EInvoiceTypeError('Geçersiz fatura verisi.');
    }
    const { matrah = 0, binaAdi = '', binaNo = '', aliciAdi = '', aliciSoyadi = '', aliciUnvan = '', hesaplanankdv = 0, sehir = '', ulke = '', paraBirimi = '', dovzTLkur = 0, faturaTarihi = '', mahalleSemtIlce = '', belgeNumarasi = '', kapiNo = '', eposta = '', fax = '', bulvarcaddesokak = '', vergilerDahilToplamTutar = 0, faturaTipi = '', not = '', okcSeriNo, siparisTarihi, siparisNumarasi, odenecekTutar = 0, tel = '', postaKodu = '', malHizmetTable = [], malhizmetToplamTutari = 0, fisTarihi, fisNo, fisSaati, fisTipi, iadeTable, ozelMatrahTutari = 0, ozelMatrahOrani = 0, ozelMatrahVergiTutari = 0, vergiDairesi = '', vknTckn = '', vergiCesidi, saat = '', toplamIskonto = 0, vergilerToplami = 0, kasabaKoy = '', tip = '', faturaUuid = '', irsaliyeTarihi, irsaliyeNumarasi, websitesi = '', hangiTip, zRaporNo, ...other } = value;
    return {
        ...other,
        base: matrah,
        buildingName: binaAdi,
        buildingNumber: binaNo,
        buyerFirstName: aliciAdi,
        buyerLastName: aliciSoyadi,
        buyerTitle: aliciUnvan,
        calculatedVAT: hesaplanankdv,
        city: sehir,
        country: ulke,
        currency: paraBirimi,
        currencyRate: dovzTLkur,
        date: faturaTarihi,
        district: mahalleSemtIlce,
        documentNumber: belgeNumarasi,
        doorNumber: kapiNo,
        email: eposta,
        faxNumber: fax,
        fullAddress: bulvarcaddesokak,
        includedTaxesTotalPrice: vergilerDahilToplamTutar,
        invoiceType: faturaTipi,
        note: not,
        okcSerialNumber: okcSeriNo,
        orderDate: siparisTarihi,
        orderNumber: siparisNumarasi,
        paymentPrice: odenecekTutar,
        phoneNumber: tel,
        postNumber: postaKodu,
        products: malHizmetTable.map((product) => {
            const { iskontoArttm = '', iskontoTutari = 0, iskontoOrani = 0, iskontoNedeni = '', malHizmet = '', fiyat = 0, miktar = 0, ozelMatrahTutari = 0, vergiOrani = 0, malHizmetTutari = 0, birimFiyat = 0, birim = '', kdvTutari = 0, vergininKdvTutari = 0, kdvOrani = 0, ...other } = product;
            return {
                ...other,
                discountOrIncrement: iskontoArttm,
                discountOrIncrementAmount: iskontoTutari,
                discountOrIncrementRate: iskontoOrani,
                discountOrIncrementReason: iskontoNedeni,
                name: malHizmet,
                price: fiyat,
                quantity: miktar,
                specialBaseAmount: ozelMatrahTutari,
                taxRate: vergiOrani,
                totalAmount: malHizmetTutari,
                unitPrice: birimFiyat,
                unitType: birim,
                vatAmount: kdvTutari,
                vatAmountOfTax: vergininKdvTutari,
                vatRate: kdvOrani
            };
        }),
        productsTotalPrice: malhizmetToplamTutari,
        receiptDate: fisTarihi,
        receiptNumber: fisNo,
        receiptTime: fisSaati,
        receiptType: fisTipi,
        refundTable: Array.isArray(iadeTable)
            ? iadeTable.map((item) => {
                const { faturaNo = '', duzenlenmeTarihi = '', ...other } = item;
                return {
                    ...other,
                    invoiceNumber: faturaNo,
                    date: duzenlenmeTarihi
                };
            })
            : undefined,
        specialBaseAmount: ozelMatrahTutari,
        specialBasePercent: ozelMatrahOrani,
        specialBaseTaxAmount: ozelMatrahVergiTutari,
        taxOffice: vergiDairesi,
        taxOrIdentityNumber: vknTckn,
        taxType: vergiCesidi,
        time: saat,
        totalDiscountOrIncrement: toplamIskonto,
        totalTaxes: vergilerToplami,
        town: kasabaKoy,
        type: tip,
        uuid: faturaUuid,
        waybillDate: irsaliyeTarihi,
        waybillNumber: irsaliyeNumarasi,
        website: websitesi,
        whichType: hangiTip,
        zReportNumber: zRaporNo
    };
}

var InvoiceType;
(function (InvoiceType) {
    InvoiceType["SATIS"] = "SATIS";
    InvoiceType["IADE"] = "IADE";
    InvoiceType["TEVKIFAT"] = "TEVKIFAT";
    InvoiceType["ISTISNA"] = "ISTISNA";
    InvoiceType["OZEL_MATRAH"] = "OZELMATRAH";
    InvoiceType["IHRAC_KAYITLI"] = "IHRACKAYITLI";
    InvoiceType["HAL_TIPI_FATURA_SATIS"] = "HKSSATIS";
    InvoiceType["HAL_TIPI_FATURA_KOMISYONCU"] = "HKSKOMISYONCU";
})(InvoiceType || (InvoiceType = {}));
var InvoiceType$1 = InvoiceType;

var EInvoiceCountry;
(function (EInvoiceCountry) {
    EInvoiceCountry["TURKIYE"] = "T\u00FCrkiye";
    EInvoiceCountry["ABD_MINOR_OUTLYING_A"] = "Abd Minor Outlying A";
    EInvoiceCountry["ABD_VIRJIN_ADALARI"] = "Abd Virjin Adalar\u0131";
    EInvoiceCountry["AFGANISTAN"] = "Afganistan";
    EInvoiceCountry["ALMANYA"] = "Almanya";
    EInvoiceCountry["AMERIKA_BIRLESIK_DEV"] = "Amerika Birle\u015Fik Dev";
    EInvoiceCountry["AMERIKA_SAMOASI"] = "Amerika Samoasi";
    EInvoiceCountry["ANDORRA"] = "Andorra";
    EInvoiceCountry["ANGOLA"] = "Angola";
    EInvoiceCountry["ANGUILLA"] = "Anguilla";
    EInvoiceCountry["ANTARTIKA"] = "Antartika";
    EInvoiceCountry["ANTIGUA_VE_BERMUDA"] = "Antigua Ve Bermuda";
    EInvoiceCountry["ARJANTIN"] = "Arjantin";
    EInvoiceCountry["ARNAVUTLUK"] = "Arnavutluk";
    EInvoiceCountry["ARUBA"] = "Aruba";
    EInvoiceCountry["AVUSTRALYA"] = "Avustralya";
    EInvoiceCountry["AVUSTRALYA_OKYANUSU"] = "Avustralya Okyanusu";
    EInvoiceCountry["AVUSTURYA"] = "Avusturya";
    EInvoiceCountry["AZERBEYCAN"] = "Azerbeycan-Nah\u00E7ivan";
    EInvoiceCountry["BAHAMALAR"] = "Bahamalar";
    EInvoiceCountry["BAHREYN"] = "Bahreyn";
    EInvoiceCountry["BANGLADES"] = "Banglade\u015F";
    EInvoiceCountry["BARBADOS"] = "Barbados";
    EInvoiceCountry["BELCIKA"] = "Bel\u00E7ika";
    EInvoiceCountry["BELIZE"] = "Belize";
    EInvoiceCountry["BENIN"] = "Benin";
    EInvoiceCountry["BERMUDA"] = "Bermuda";
    EInvoiceCountry["BEYAZ_RUSYA"] = "Beyaz Rusya";
    EInvoiceCountry["BHUTAN"] = "Bhutan";
    EInvoiceCountry["BOLIVYA"] = "Bolivya";
    EInvoiceCountry["BOSNA"] = "Bosna-Hersek";
    EInvoiceCountry["BOSTVANA"] = "Bostvana";
    EInvoiceCountry["BOUVET_ADASI"] = "Bouvet Adas\u0131";
    EInvoiceCountry["BREZILYA"] = "Brezilya";
    EInvoiceCountry["BRUNEI"] = "Brunei";
    EInvoiceCountry["BULGARISTAN"] = "Bulgaristan";
    EInvoiceCountry["BURKINA_FASO"] = "Burkina Faso";
    EInvoiceCountry["BURMA"] = "Burma";
    EInvoiceCountry["BURUNDI"] = "Burundi";
    EInvoiceCountry["BIRLESIK_ARAP_EMIRLI"] = "Birle\u015Fik Arap Emirli";
    EInvoiceCountry["BIRLESIK_DEVLETLER_M"] = "Birle\u015Fik Devletler M";
    EInvoiceCountry["BIRLESIK_KRALLIK"] = "Birle\u015Fik Krallik";
    EInvoiceCountry["BISMARK_ARCHIPELAGO"] = "Bismark Archipelago";
    EInvoiceCountry["CAPE_VERDE"] = "Cape Verde";
    EInvoiceCountry["CAYMAN_ADALARI"] = "Cayman Adalar\u0131";
    EInvoiceCountry["CEBELI_TARIK"] = "Cebeli Tarik";
    EInvoiceCountry["CEUTA_VE_MELILLA"] = "Ceuta Ve Melilla";
    EInvoiceCountry["CEZAYIR"] = "Cezayir";
    EInvoiceCountry["CHRISTMAS_ADALARI"] = "Christmas Adalar\u0131";
    EInvoiceCountry["COOK_ADALARI"] = "Cook Adalar\u0131";
    EInvoiceCountry["CIBUTI"] = "Cibuti";
    EInvoiceCountry["CAD"] = "\u00C7ad";
    EInvoiceCountry["CEK_CUMHURIYETI"] = "\u00C7ek Cumhuriyeti";
    EInvoiceCountry["CECEN_CUMHURIYETI"] = "\u00C7e\u00E7en Cumhuriyeti";
    EInvoiceCountry["CIN_HALK_CUMHURIYETI"] = "\u00C7in Halk Cumhuriyeti";
    EInvoiceCountry["DANIMARKA"] = "Danimarka";
    EInvoiceCountry["DAGISTAN_CUMHURIYETI"] = "Da\u011Fistan Cumhuriyeti";
    EInvoiceCountry["DOMINIK_CUMHURIYETI"] = "Dominik Cumhuriyeti";
    EInvoiceCountry["DOMINIKA"] = "Dominika";
    EInvoiceCountry["DOGU_TIMOR"] = "Do\u011Fu Timor";
    EInvoiceCountry["DUBAI"] = "Dubai";
    EInvoiceCountry["EKVATOR"] = "Ekvator";
    EInvoiceCountry["EKVATOR_GINESI"] = "Ekvator Ginesi";
    EInvoiceCountry["EL_SALVADOR"] = "El Salvador";
    EInvoiceCountry["ENDONEZYA"] = "Endonezya";
    EInvoiceCountry["ERMENISTAN"] = "Ermenistan";
    EInvoiceCountry["ERITRE"] = "Eritre";
    EInvoiceCountry["ESTONYA"] = "Estonya";
    EInvoiceCountry["ETIYOPYA"] = "Etiyopya";
    EInvoiceCountry["FALKLAND_ADALARI"] = "Falkland Adalar\u0131";
    EInvoiceCountry["FAROE_ADALARI"] = "Faroe Adalar\u0131";
    EInvoiceCountry["FAS"] = "Fas";
    EInvoiceCountry["FRANSA"] = "Fransa";
    EInvoiceCountry["FRANSIZ_GUYANASI"] = "Fransiz Guyanasi";
    EInvoiceCountry["FRANSIZ_GUNEY_TOPRAK"] = "Fransiz G\u00FCney Toprak";
    EInvoiceCountry["FRANSIZ_POLINEZYASI"] = "Fransiz Polinezyasi";
    EInvoiceCountry["FIJI"] = "Fiji";
    EInvoiceCountry["FILDISI_SAHILI"] = "Fildi\u015Fi Sahili";
    EInvoiceCountry["FILIPINLER"] = "Filipinler";
    EInvoiceCountry["FILISTIN"] = "Filistin";
    EInvoiceCountry["FINLANDIYA"] = "Finlandiya";
    EInvoiceCountry["GABON"] = "Gabon";
    EInvoiceCountry["GAMBIYA"] = "Gambiya";
    EInvoiceCountry["GANA"] = "Gana";
    EInvoiceCountry["GRENADA"] = "Grenada";
    EInvoiceCountry["GRONLAND"] = "Gr\u00F6nland";
    EInvoiceCountry["GUADELUP"] = "Guadelup";
    EInvoiceCountry["GUAM"] = "Guam";
    EInvoiceCountry["GUATEMALA"] = "Guatemala";
    EInvoiceCountry["GUYANA"] = "Guyana";
    EInvoiceCountry["GUNEY_AFRIKA_CUMHURI"] = "G\u00FCney Afrika Cumhuri";
    EInvoiceCountry["GUNEY_FRANSIZ_TOPRAK"] = "G\u00FCney Fransiz Toprak";
    EInvoiceCountry["GUNEY_GEORGIA_VE_GUN"] = "G\u00FCney Georgia Ve G\u00FCn";
    EInvoiceCountry["GUNEY_KORE_CUMHURIYE"] = "G\u00FCney Kore Cumhuriye";
    EInvoiceCountry["GUNEY_YEMEN"] = "G\u00FCney Yemen";
    EInvoiceCountry["GURCISTAN"] = "G\u00FCrcistan";
    EInvoiceCountry["GINE"] = "Gine";
    EInvoiceCountry["GINEBISSAU"] = "Gine-Bissau";
    EInvoiceCountry["HAITI"] = "Haiti";
    EInvoiceCountry["HEARD_ADALARI_VE_MC"] = "Heard Adalar\u0131 Ve Mc";
    EInvoiceCountry["HIRVATISTAN"] = "Hirvatistan";
    EInvoiceCountry["HOLLANDA"] = "Hollanda";
    EInvoiceCountry["HOLLANDA_ANTILLERI"] = "Hollanda Antilleri";
    EInvoiceCountry["HONDURAS"] = "Honduras";
    EInvoiceCountry["HONG_KONG"] = "Hong Kong";
    EInvoiceCountry["HINDISTAN"] = "Hindistan";
    EInvoiceCountry["IRAK"] = "Irak";
    EInvoiceCountry["INGILIZ_HINT_OKYTOP"] = "\u0130ngiliz Hint Oky.Top";
    EInvoiceCountry["INGILIZ_VIRGIN_ADALA"] = "\u0130ngiliz Virgin Adala";
    EInvoiceCountry["IRAN"] = "\u0130ran";
    EInvoiceCountry["IRLANDA"] = "\u0130rlanda";
    EInvoiceCountry["ISPANYA"] = "\u0130spanya";
    EInvoiceCountry["ISRAIL"] = "\u0130srail";
    EInvoiceCountry["ISVEC"] = "\u0130sve\u00E7";
    EInvoiceCountry["ISVICRE"] = "\u0130svi\u00E7re";
    EInvoiceCountry["ITALYA"] = "\u0130talya";
    EInvoiceCountry["IZLANDA"] = "\u0130zlanda";
    EInvoiceCountry["ISGAL_ALTINDAKI_FILI"] = "\u0130\u015Fgal Altindaki Fili";
    EInvoiceCountry["JAMAIKA"] = "Jamaika";
    EInvoiceCountry["JAPONYA"] = "Japonya";
    EInvoiceCountry["KAMBOCYA"] = "Kambo\u00E7ya";
    EInvoiceCountry["KAMERUN"] = "Kamerun";
    EInvoiceCountry["KANADA"] = "Kanada";
    EInvoiceCountry["KARADAG"] = "Karada\u011F";
    EInvoiceCountry["KATAR"] = "Katar";
    EInvoiceCountry["KAZAKISTAN"] = "Kazakistan";
    EInvoiceCountry["KENYA"] = "Kenya";
    EInvoiceCountry["KIBRIS_RUM_KESIMI"] = "Kibris Rum Kesimi";
    EInvoiceCountry["KIRGIZISTAN"] = "Kirgizistan";
    EInvoiceCountry["KOKOS_ADALARI"] = "Kokos Adalar\u0131";
    EInvoiceCountry["KOLOMBIYA"] = "Kolombiya";
    EInvoiceCountry["KOMORO_ADALARI"] = "Komoro Adalar\u0131";
    EInvoiceCountry["KONGO"] = "Kongo";
    EInvoiceCountry["KOSOVA"] = "Kosova";
    EInvoiceCountry["KOSTA_RIKA"] = "Kosta Rika";
    EInvoiceCountry["KUTUP_BOLGELERI"] = "Kutup B\u00F6lgeleri";
    EInvoiceCountry["KUVEYT"] = "Kuveyt";
    EInvoiceCountry["KUZEY_KIBRIS_TURK_CU"] = "Kuzey Kibris T\u00FCrk Cu";
    EInvoiceCountry["KUZEY_KORE_DEMOKRATI"] = "Kuzey Kore Demokrati";
    EInvoiceCountry["KUZEY_MARIANA_ADALAR"] = "Kuzey Mariana Adalar";
    EInvoiceCountry["KUZEY_YEMEN"] = "Kuzey Yemen";
    EInvoiceCountry["KONGO_DEMOKRATIK_CU"] = "Kongo (Demokratik Cu)";
    EInvoiceCountry["KUBA"] = "K\u00FCba";
    EInvoiceCountry["KIRIBATI"] = "Kiribati";
    EInvoiceCountry["LAOS"] = "Laos";
    EInvoiceCountry["LESOTHO"] = "Lesotho";
    EInvoiceCountry["LETONYA"] = "Letonya";
    EInvoiceCountry["LIESHTENSTEIN"] = "Lieshtenstein";
    EInvoiceCountry["LUBNAN"] = "L\u00FCbnan";
    EInvoiceCountry["LUKSEMBURG"] = "L\u00FCksemburg";
    EInvoiceCountry["LIBERYA"] = "Liberya";
    EInvoiceCountry["LIBYA"] = "Libya";
    EInvoiceCountry["LITVANYA"] = "Litvanya";
    EInvoiceCountry["MACARISTAN"] = "Macaristan";
    EInvoiceCountry["MADAGASKAR"] = "Madagaskar";
    EInvoiceCountry["MAKAO"] = "Makao";
    EInvoiceCountry["MAKEDONYA"] = "Makedonya";
    EInvoiceCountry["MALAVI"] = "Malavi";
    EInvoiceCountry["MALDIV_ADALARI"] = "Maldiv Adalar\u0131";
    EInvoiceCountry["MALEZYA"] = "Malezya";
    EInvoiceCountry["MALTA"] = "Malta";
    EInvoiceCountry["MALI"] = "Mali";
    EInvoiceCountry["MARSHALL_ADALARI"] = "Marshall Adalar\u0131";
    EInvoiceCountry["MARTINIK"] = "Martinik";
    EInvoiceCountry["MAURITIUS"] = "Mauritius";
    EInvoiceCountry["MAYOTTE"] = "Mayotte";
    EInvoiceCountry["MEKSIKA"] = "Meksika";
    EInvoiceCountry["MELILLA"] = "Melilla";
    EInvoiceCountry["MISIR"] = "Misir";
    EInvoiceCountry["MOLDAVYA"] = "Moldavya";
    EInvoiceCountry["MONACO"] = "Monaco";
    EInvoiceCountry["MONTSERRAT"] = "Montserrat";
    EInvoiceCountry["MORITANYA"] = "Moritanya";
    EInvoiceCountry["MOZAMBIK"] = "Mozambik";
    EInvoiceCountry["MOGOLISTAN"] = "Mo\u011Folistan";
    EInvoiceCountry["MYANMAR"] = "Myanmar";
    EInvoiceCountry["MIKRONEZYA"] = "Mikronezya";
    EInvoiceCountry["NAMIBYA"] = "Namibya";
    EInvoiceCountry["NAURU"] = "Nauru";
    EInvoiceCountry["NEPAL"] = "Nepal";
    EInvoiceCountry["NORFOLK_ADASI"] = "Norfolk Adas\u0131";
    EInvoiceCountry["NORVEC"] = "Norve\u00E7";
    EInvoiceCountry["NIJER"] = "Nijer";
    EInvoiceCountry["NIJERYA"] = "Nijerya";
    EInvoiceCountry["NIKARAGUA"] = "Nikaragua";
    EInvoiceCountry["NIUE"] = "Niue";
    EInvoiceCountry["ORTA_AFRIKA_CUMHURIY"] = "Orta Afrika Cumhuriy";
    EInvoiceCountry["OZBEKISTAN"] = "\u00D6zbekistan";
    EInvoiceCountry["PAKISTAN"] = "Pakistan";
    EInvoiceCountry["PALAU"] = "Palau";
    EInvoiceCountry["PANAMA"] = "Panama";
    EInvoiceCountry["PAPUA_YENI_GINE"] = "Papua Yeni Gine";
    EInvoiceCountry["PARAGUAY"] = "Paraguay";
    EInvoiceCountry["PERU"] = "Peru";
    EInvoiceCountry["POLONYA"] = "Polonya";
    EInvoiceCountry["PORTEKIZ"] = "Portekiz";
    EInvoiceCountry["PITCAIRN"] = "Pitcairn";
    EInvoiceCountry["REUNION"] = "Reunion";
    EInvoiceCountry["ROMANYA"] = "Romanya";
    EInvoiceCountry["RUANDA"] = "Ruanda";
    EInvoiceCountry["RUSYA_FEDERASYONU"] = "Rusya Federasyonu";
    EInvoiceCountry["SAN_MARINO"] = "San Marino";
    EInvoiceCountry["SAO_TOME_AND_PRINCIP"] = "Sao Tome And Princip";
    EInvoiceCountry["SENEGAL"] = "Senegal";
    EInvoiceCountry["SEPTECEUTA"] = "Septe(Ceuta)";
    EInvoiceCountry["SEYSEL_ADALARI_VE_BA"] = "Sey\u015Fel Adalar\u0131 Ve Ba";
    EInvoiceCountry["SIERRA_LEONE"] = "Sierra Leone";
    EInvoiceCountry["SIRBISTAN"] = "Sirbistan";
    EInvoiceCountry["SLOVAKYA"] = "Slovakya";
    EInvoiceCountry["SLOVENYA"] = "Slovenya";
    EInvoiceCountry["SOLOMON_ADALARI"] = "Solomon Adalar\u0131";
    EInvoiceCountry["SOMALI"] = "Somali";
    EInvoiceCountry["SRI_LANKA"] = "Sri Lanka";
    EInvoiceCountry["ST_VINCENT_VE_GRENAD"] = "St Vincent Ve Grenad";
    EInvoiceCountry["ST_HELENA_VE_BAGLAN"] = "St. Helena Ve Ba\u011Flan";
    EInvoiceCountry["ST_KITTS_VE_NEVIS"] = "St. Kitts Ve Nevis";
    EInvoiceCountry["ST_LUCIA"] = "St. Lucia";
    EInvoiceCountry["ST_PIERRE_VE_MIQUEL"] = "St. Pierre Ve Miquel";
    EInvoiceCountry["SUDAN"] = "Sudan";
    EInvoiceCountry["SURINAM"] = "Surinam";
    EInvoiceCountry["SURIYE"] = "Suriye";
    EInvoiceCountry["SUUDI_ARABISTAN"] = "Suudi Arabistan";
    EInvoiceCountry["SVAZILAND"] = "Svaziland";
    EInvoiceCountry["SAMOA_BATI_SAMOA"] = "Samoa (Bat\u0131 Samoa)";
    EInvoiceCountry["SERBEST_BOLGE_BA"] = "Serbest B\u00F6lge (Ba-Bs)";
    EInvoiceCountry["SINGAPUR"] = "Singapur";
    EInvoiceCountry["SILI"] = "\u015Eili";
    EInvoiceCountry["TACIKISTAN"] = "Tacikistan";
    EInvoiceCountry["TAYLAND"] = "Tayland";
    EInvoiceCountry["TAYVAN"] = "Tayvan";
    EInvoiceCountry["TOGO"] = "Togo";
    EInvoiceCountry["TOKELAU"] = "Tokelau";
    EInvoiceCountry["TONGA"] = "Tonga";
    EInvoiceCountry["TRINIDAD_VE_TOBAGO"] = "Trinidad Ve Tobago";
    EInvoiceCountry["TUNUS"] = "Tunus";
    EInvoiceCountry["TURKS_VE_CAICOS_ADAS"] = "Turks Ve Caicos Adas";
    EInvoiceCountry["TUVALU"] = "Tuvalu";
    EInvoiceCountry["TANZANYA_BIRLESIK_C"] = "Tanzanya (Birle\u015Fik C)";
    EInvoiceCountry["TURKMENISTAN"] = "T\u00FCrkmenistan";
    EInvoiceCountry["UGANDA"] = "Uganda";
    EInvoiceCountry["UKRAYNA"] = "Ukrayna";
    EInvoiceCountry["UMMAN"] = "Umman";
    EInvoiceCountry["URUGUAY"] = "Uruguay";
    EInvoiceCountry["URDUN"] = "\u00DCrd\u00FCn";
    EInvoiceCountry["VANUATU"] = "Vanuatu";
    EInvoiceCountry["VATIKAN"] = "Vatikan";
    EInvoiceCountry["VENEZUELLA"] = "Venezuella";
    EInvoiceCountry["VIETNAM"] = "Vietnam";
    EInvoiceCountry["WALLIS_VE_FUTUNA_ADA"] = "Wallis Ve Futuna Ada";
    EInvoiceCountry["YAKUTISTAN"] = "Yakutistan";
    EInvoiceCountry["YEMEN"] = "Yemen";
    EInvoiceCountry["YENI_KALODENYA_VE_BA"] = "Yeni Kalodenya Ve Ba";
    EInvoiceCountry["YENI_ZELANDA"] = "Yeni Zelanda";
    EInvoiceCountry["YENI_ZELANDA_OKYANUS"] = "Yeni Zelanda Okyanus";
    EInvoiceCountry["YUGOSLAVYAESKI_YUGO"] = "Yugoslavya(Eski Yugo)";
    EInvoiceCountry["YUGOSLAVYASIRBISTAN"] = "Yugoslavya(Sirbistan)";
    EInvoiceCountry["YUNANISTAN"] = "Yunanistan";
    EInvoiceCountry["ZAMBIA"] = "Zambia";
    EInvoiceCountry["ZIMBABVE"] = "Zimbabve";
})(EInvoiceCountry || (EInvoiceCountry = {}));
var EInvoiceCountry$1 = EInvoiceCountry;

var EInvoiceUnitType;
(function (EInvoiceUnitType) {
    EInvoiceUnitType["GUN"] = "DAY";
    EInvoiceUnitType["AY"] = "MON";
    EInvoiceUnitType["YIL"] = "ANN";
    EInvoiceUnitType["SAAT"] = "HUR";
    EInvoiceUnitType["DAKIKA"] = "D61";
    EInvoiceUnitType["SANIYE"] = "D62";
    EInvoiceUnitType["ADET"] = "C62";
    EInvoiceUnitType["PAKET"] = "PA";
    EInvoiceUnitType["KUTU"] = "BX";
    EInvoiceUnitType["MG"] = "MGM";
    EInvoiceUnitType["G"] = "GRM";
    EInvoiceUnitType["KG"] = "KGM";
    EInvoiceUnitType["LT"] = "LTR";
    EInvoiceUnitType["TON"] = "TNE";
    EInvoiceUnitType["NET_TON"] = "NT";
    EInvoiceUnitType["GROSS_TON"] = "GT";
    EInvoiceUnitType["MM"] = "MMT";
    EInvoiceUnitType["CM"] = "CMT";
    EInvoiceUnitType["M"] = "MTR";
    EInvoiceUnitType["KM"] = "KTM";
    EInvoiceUnitType["ML"] = "MLT";
    EInvoiceUnitType["MM3"] = "MMQ";
    EInvoiceUnitType["CM2"] = "CMK";
    EInvoiceUnitType["CM3"] = "CMQ";
    EInvoiceUnitType["M2"] = "MTK";
    EInvoiceUnitType["M3"] = "MTQ";
    EInvoiceUnitType["KJ"] = "KJO";
    EInvoiceUnitType["CL"] = "CLT";
    EInvoiceUnitType["KARAT"] = "CT";
    EInvoiceUnitType["KWH"] = "KWH";
    EInvoiceUnitType["TON_BASINA_TASIMA_KAPASITESI"] = "CCT";
    EInvoiceUnitType["BRUT_KALORI"] = "D30";
    EInvoiceUnitType["BIN_LT"] = "D40";
    EInvoiceUnitType["SAF_ALKOL_LT"] = "LPA";
    EInvoiceUnitType["KGM2"] = "B32";
    EInvoiceUnitType["HUCRE_AT"] = "NCL";
    EInvoiceUnitType["CIFT"] = "PR";
    EInvoiceUnitType["BIN_M3"] = "R9";
    EInvoiceUnitType["SET"] = "SET";
    EInvoiceUnitType["BIN_ADET"] = "T3";
    EInvoiceUnitType["SCM"] = "Q37";
    EInvoiceUnitType["NCM"] = "Q39";
    EInvoiceUnitType["MMBTU"] = "J39";
    EInvoiceUnitType["M3_GUN"] = "G52";
    EInvoiceUnitType["DUZINE"] = "DZN";
    EInvoiceUnitType["DMK"] = "dm2";
})(EInvoiceUnitType || (EInvoiceUnitType = {}));
var EInvoiceUnitType$1 = EInvoiceUnitType;

var HourlySearchInterval;
(function (HourlySearchInterval) {
    HourlySearchInterval["NONE"] = "NONE";
    HourlySearchInterval["FIRST_HALF"] = "FIRST_HALF";
    HourlySearchInterval["LAST_HALF"] = "LAST_HALF";
})(HourlySearchInterval || (HourlySearchInterval = {}));
var HourlySearchInterval$1 = HourlySearchInterval;

var EInvoiceApiErrorCode;
(function (EInvoiceApiErrorCode) {
    /**
     * Bilinmeyen bir hata oluştu.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["UNKNOWN_ERROR"] = 1] = "UNKNOWN_ERROR";
    /**
     * Oturum zaman aşımına uğradı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["SESSION_TIMEOUT"] = 2] = "SESSION_TIMEOUT";
    /**
     * Geçersiz API cevabı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVALID_RESPONSE"] = 3] = "INVALID_RESPONSE";
    /**
     * Geçersiz erişim jetonu.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVALID_ACCESS_TOKEN"] = 4] = "INVALID_ACCESS_TOKEN";
    /**
     * Basit fatura oluşturulamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["BASIC_INVOICE_NOT_CREATED"] = 5] = "BASIC_INVOICE_NOT_CREATED";
    /**
     * Detaylı fatura bulunamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVOICE_NOT_FOUND"] = 6] = "INVOICE_NOT_FOUND";
    /**
     * Basit fatura bulunamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["BASIC_INVOICE_NOT_FOUND"] = 7] = "BASIC_INVOICE_NOT_FOUND";
    /**
     * Geçersiz fatura HTML cevabı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVALID_INVOICE_HTML"] = 8] = "INVALID_INVOICE_HTML";
    /**
     * Kullanıcı (şirket) bilgisi bulunamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["USER_INFORMATION_NOT_FOUND"] = 9] = "USER_INFORMATION_NOT_FOUND";
    /**
     * Kullanıcı (şirket) bilgileri güncellenemedı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["USER_INFORMATION_NOT_UPDATED"] = 10] = "USER_INFORMATION_NOT_UPDATED";
    /**
     * Kayıtlı telefon numarası bulunamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["SAVED_PHONE_NUMBER_NOT_FOUND"] = 11] = "SAVED_PHONE_NUMBER_NOT_FOUND";
    /**
     * Geçersiz SMS işlem kimliği.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVALID_SMS_OPERATION_ID"] = 12] = "INVALID_SMS_OPERATION_ID";
    /**
     * Temel faturalar imzalanamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["BASIC_INVOICES_COULD_NOT_SIGNED"] = 13] = "BASIC_INVOICES_COULD_NOT_SIGNED";
    /**
     * Fatura iptal talebi oluşturulamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVOICE_CANCEL_REQUEST_NOT_CREATED"] = 14] = "INVOICE_CANCEL_REQUEST_NOT_CREATED";
    /**
     * Basit fatura silinemedi.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["BASIC_INVOICE_NOT_DELETED"] = 15] = "BASIC_INVOICE_NOT_DELETED";
    /**
     * Geçersiz anonim kullanıcı kimliği.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVALID_ANONYMOUS_USER_ID"] = 16] = "INVALID_ANONYMOUS_USER_ID";
    /**
     * Şirket bilgileri bulunamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["COMPANY_INFORMATION_NOT_FOUND"] = 17] = "COMPANY_INFORMATION_NOT_FOUND";
    /**
     * Faturaya ait xml dosyası bulunamadı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVOICE_XML_FILE_NOT_FOUND"] = 18] = "INVOICE_XML_FILE_NOT_FOUND";
    /**
     * Geçersiz fatura zip dosyası yanıtı.
     */
    EInvoiceApiErrorCode[EInvoiceApiErrorCode["INVALID_INVOICE_ZIP_FILE_RESPONSE"] = 19] = "INVALID_INVOICE_ZIP_FILE_RESPONSE";
})(EInvoiceApiErrorCode || (EInvoiceApiErrorCode = {}));
var EInvoiceApiErrorCode$1 = EInvoiceApiErrorCode;

var EInvoiceCurrencyType;
(function (EInvoiceCurrencyType) {
    EInvoiceCurrencyType["AFGHANI"] = "AFN";
    EInvoiceCurrencyType["ALGERIAN_DINAR"] = "DZD";
    EInvoiceCurrencyType["ARGENTINE_PESO"] = "ARS";
    EInvoiceCurrencyType["ARUBAN_GUILDER"] = "AWG";
    EInvoiceCurrencyType["AUSTRALIAN_DOLLAR"] = "AUD";
    EInvoiceCurrencyType["AZERBAIJANIAN_MANAT"] = "AZM";
    EInvoiceCurrencyType["BAHAMIAN_DOLLAR"] = "BSD";
    EInvoiceCurrencyType["BAHRAINI_DINAR"] = "BHD";
    EInvoiceCurrencyType["BAHT"] = "THB";
    EInvoiceCurrencyType["BALBOA"] = "PAB";
    EInvoiceCurrencyType["BARBADOS_DOLLAR"] = "BBD";
    EInvoiceCurrencyType["BELARUSSIAN_RUBLE"] = "BYR";
    EInvoiceCurrencyType["BELIZE_DOLLAR"] = "BZD";
    EInvoiceCurrencyType["BERMUDIAN_DOLLAR"] = "BMD";
    EInvoiceCurrencyType["BOLIVAR"] = "VEB";
    EInvoiceCurrencyType["BOLIVIANO"] = "BOB";
    EInvoiceCurrencyType["BULGARIAN_LEV"] = "BGN";
    EInvoiceCurrencyType["BRAZILIAN_REAL"] = "BRL";
    EInvoiceCurrencyType["BRUNEI_DOLLAR"] = "BND";
    EInvoiceCurrencyType["BURUNDI_FRANC"] = "BIF";
    EInvoiceCurrencyType["CANADIAN_DOLLAR"] = "CAD";
    EInvoiceCurrencyType["CAPE_VERDE_ESCUDO"] = "CVE";
    EInvoiceCurrencyType["CAYMAN_ISLANDS_DOLLAR"] = "KYD";
    EInvoiceCurrencyType["CEDI"] = "GHC";
    EInvoiceCurrencyType["CFA_FRANC_XAF"] = "XAF";
    EInvoiceCurrencyType["CFA_FRANC_XOF"] = "XOF";
    EInvoiceCurrencyType["CFP_FRANC_XPF"] = "XPF";
    EInvoiceCurrencyType["CHILEAN_PESO"] = "CLP";
    EInvoiceCurrencyType["COLOMBIAN_PESO"] = "COP";
    EInvoiceCurrencyType["COMORO_FRANC"] = "KMF";
    EInvoiceCurrencyType["CORDOBA_ORO"] = "NIO";
    EInvoiceCurrencyType["COSTA_RICAN_COLON"] = "CRC";
    EInvoiceCurrencyType["CUBAN_PESO"] = "CUP";
    EInvoiceCurrencyType["CYPRUS_POUND"] = "CYP";
    EInvoiceCurrencyType["CZECH_KORUNA"] = "CZK";
    EInvoiceCurrencyType["DANISH_KRONE"] = "DKK";
    EInvoiceCurrencyType["DALASI"] = "GMD";
    EInvoiceCurrencyType["DENAR"] = "MKD";
    EInvoiceCurrencyType["DIRHAM"] = "AED";
    EInvoiceCurrencyType["DJIBOUTI_FRANC"] = "DJF";
    EInvoiceCurrencyType["DOBRA"] = "STD";
    EInvoiceCurrencyType["DOMINICAN_PESO"] = "DOP";
    EInvoiceCurrencyType["DONG"] = "VND";
    EInvoiceCurrencyType["DRAM"] = "AMD";
    EInvoiceCurrencyType["EAST_CARRIBEAN_DOLLAR"] = "XCD";
    EInvoiceCurrencyType["EGYPTIAN_POUND"] = "EGP";
    EInvoiceCurrencyType["EL_SALVADOR_COLON"] = "SVC";
    EInvoiceCurrencyType["ETHOPIAN_BIRR"] = "ETB";
    EInvoiceCurrencyType["EURO"] = "EUR";
    EInvoiceCurrencyType["FALKLAND_ISLANDS_POUND"] = "FKP";
    EInvoiceCurrencyType["FIJI_DOLLAR"] = "FJD";
    EInvoiceCurrencyType["FORINT"] = "HUF";
    EInvoiceCurrencyType["FRANC_CONGOLAIS"] = "CDF";
    EInvoiceCurrencyType["GIBRALTAR_POUND"] = "GIP";
    EInvoiceCurrencyType["GOLD"] = "XAU";
    EInvoiceCurrencyType["GOURDE"] = "HTG";
    EInvoiceCurrencyType["GUARANI"] = "PYG";
    EInvoiceCurrencyType["GUINEA_FRANC"] = "GNF";
    EInvoiceCurrencyType["GUYANA_DOLLAR"] = "GYD";
    EInvoiceCurrencyType["HKD"] = "HKD";
    EInvoiceCurrencyType["HRYVNIA"] = "UAH";
    EInvoiceCurrencyType["ICELAND_KRONA"] = "ISK";
    EInvoiceCurrencyType["INDIAN_RUPEE"] = "INR";
    EInvoiceCurrencyType["IRAQI_DINAR"] = "IQD";
    EInvoiceCurrencyType["IRANIAN_RIAL"] = "IRR";
    EInvoiceCurrencyType["JAMAICAN_DOLLAR"] = "JMD";
    EInvoiceCurrencyType["JORDANIAN_DINAR"] = "JOD";
    EInvoiceCurrencyType["KENYAN_SHILLING"] = "KES";
    EInvoiceCurrencyType["KINA"] = "PGK";
    EInvoiceCurrencyType["KIP"] = "LAK";
    EInvoiceCurrencyType["KROON"] = "EEK";
    EInvoiceCurrencyType["KUNA"] = "HRK";
    EInvoiceCurrencyType["KUWAITI_DINAR"] = "KWD";
    EInvoiceCurrencyType["KWACHA_MWK"] = "MWK";
    EInvoiceCurrencyType["KWACHA_ZMK"] = "ZMK";
    EInvoiceCurrencyType["KWANZA"] = "AOA";
    EInvoiceCurrencyType["KYAT"] = "MMK";
    EInvoiceCurrencyType["LARI"] = "GEL";
    EInvoiceCurrencyType["LATVIAN_LATS"] = "LVL";
    EInvoiceCurrencyType["LEBANESE_POUND"] = "LBP";
    EInvoiceCurrencyType["LEK"] = "ALL";
    EInvoiceCurrencyType["LEMPIRA"] = "HNL";
    EInvoiceCurrencyType["LEONE"] = "SLL";
    EInvoiceCurrencyType["LEU"] = "ROL";
    EInvoiceCurrencyType["LIBERIAN_DOLLAR"] = "LRD";
    EInvoiceCurrencyType["LIBYAN_DINAR"] = "LYD";
    EInvoiceCurrencyType["LILANGENI"] = "SZL";
    EInvoiceCurrencyType["LITHUANIAN_LITAS"] = "LTL";
    EInvoiceCurrencyType["LOTI"] = "LSL";
    EInvoiceCurrencyType["MALAGASY_FRANC"] = "MGF";
    EInvoiceCurrencyType["MALAYSIAN_RINGGIT"] = "MYR";
    EInvoiceCurrencyType["MALTESE_LIRA"] = "MTL";
    EInvoiceCurrencyType["MANAT"] = "TMM";
    EInvoiceCurrencyType["MAURITIUS_RUPEE"] = "MUR";
    EInvoiceCurrencyType["METICAL"] = "MZM";
    EInvoiceCurrencyType["MEXICAN_PESO"] = "MXN";
    EInvoiceCurrencyType["MOLDOVAN_LEU"] = "MDL";
    EInvoiceCurrencyType["MORROCAN_DIRHAM"] = "MAD";
    EInvoiceCurrencyType["NAIRA"] = "NGN";
    EInvoiceCurrencyType["NAKFA"] = "ERN";
    EInvoiceCurrencyType["NAMIBIA_DOLLAR"] = "NAD";
    EInvoiceCurrencyType["NEPALESE_RUPEE"] = "NPR";
    EInvoiceCurrencyType["NETHERLANDS_ANTILLIAN_GUILDER"] = "ANG";
    EInvoiceCurrencyType["NEW_DINAR"] = "YUM";
    EInvoiceCurrencyType["NEW_ISRAELI_SHEQEL"] = "ILS";
    EInvoiceCurrencyType["NEW_TAIWAN_DOLLAR"] = "TWD";
    EInvoiceCurrencyType["NEW_ZEALAND_DOLLAR"] = "NZD";
    EInvoiceCurrencyType["NORTH_KOREAN_WON"] = "KPW";
    EInvoiceCurrencyType["NORWEGIAN_KRONE"] = "NOK";
    EInvoiceCurrencyType["NGULTRUM"] = "BTN";
    EInvoiceCurrencyType["NUEVO_SOL"] = "PEN";
    EInvoiceCurrencyType["OUGUIYA"] = "MRO";
    EInvoiceCurrencyType["TONGA_PAANGASI"] = "TOP";
    EInvoiceCurrencyType["PAKISTAN_RUPEE"] = "PKR";
    EInvoiceCurrencyType["PALLADIUM"] = "XPD";
    EInvoiceCurrencyType["PATACA"] = "MOP";
    EInvoiceCurrencyType["PESO_URUGUAYO"] = "UYU";
    EInvoiceCurrencyType["PHILIPPINE_PESO"] = "PHP";
    EInvoiceCurrencyType["PLATINUM"] = "XPT";
    EInvoiceCurrencyType["POUND_STERLING"] = "GBP";
    EInvoiceCurrencyType["PULA"] = "BWP";
    EInvoiceCurrencyType["QATARI_RIAL"] = "QAR";
    EInvoiceCurrencyType["QUETZAL"] = "GTQ";
    EInvoiceCurrencyType["RAND"] = "ZAR";
    EInvoiceCurrencyType["RIAL_OMANI"] = "OMR";
    EInvoiceCurrencyType["RIEL"] = "KHR";
    EInvoiceCurrencyType["RUFIYAA"] = "MVR";
    EInvoiceCurrencyType["RUPIAH"] = "IDR";
    EInvoiceCurrencyType["RUSSIAN_RUBLE"] = "RUB";
    EInvoiceCurrencyType["RWANDA_FRANC"] = "RWF";
    EInvoiceCurrencyType["SAUDI_RIYAL"] = "SAR";
    EInvoiceCurrencyType["SDR"] = "XDR";
    EInvoiceCurrencyType["SEYCHELLES_RUPEE"] = "SCR";
    EInvoiceCurrencyType["SILVER"] = "XAG";
    EInvoiceCurrencyType["SINGAPORE_DOLLAR"] = "SGD";
    EInvoiceCurrencyType["SLOVAK_KORUNA"] = "SKK";
    EInvoiceCurrencyType["SOLOMON_ISLANDS_DOLLAR"] = "SBD";
    EInvoiceCurrencyType["SOMALI_SHILLING"] = "SOS";
    EInvoiceCurrencyType["SRI_LANKA_RUPEE"] = "LKR";
    EInvoiceCurrencyType["SOM"] = "KGS";
    EInvoiceCurrencyType["SOMONI"] = "TJS";
    EInvoiceCurrencyType["ST_HELENA_POUND"] = "SHP";
    EInvoiceCurrencyType["SUDANESE_DINAR"] = "SDD";
    EInvoiceCurrencyType["SURINAME_GUILDER"] = "SRG";
    EInvoiceCurrencyType["SWEDISH_KRONA"] = "SEK";
    EInvoiceCurrencyType["SWISS_FRANC"] = "CHF";
    EInvoiceCurrencyType["SYRIAN_POUND"] = "SYP";
    EInvoiceCurrencyType["TAKA"] = "BDT";
    EInvoiceCurrencyType["TALA"] = "WST";
    EInvoiceCurrencyType["TANZANIAN_SHILLING"] = "TZS";
    EInvoiceCurrencyType["TENGE"] = "KZT";
    EInvoiceCurrencyType["TOLAR"] = "SIT";
    EInvoiceCurrencyType["TRINIDAD_AND_TOBAGO_DOLLAR"] = "TTD";
    EInvoiceCurrencyType["TUGRIK"] = "MNT";
    EInvoiceCurrencyType["TUNISIAN_DINAR"] = "TND";
    EInvoiceCurrencyType["TURK_LIRASI"] = "TRY";
    EInvoiceCurrencyType["UGANDA_SHILLING"] = "UGX";
    EInvoiceCurrencyType["US_DOLLAR"] = "USD";
    EInvoiceCurrencyType["UZBEKISTAN_SUM"] = "UZS";
    EInvoiceCurrencyType["VATU"] = "VUV";
    EInvoiceCurrencyType["WON"] = "KRW";
    EInvoiceCurrencyType["YEMENI_RIAL"] = "YER";
    EInvoiceCurrencyType["YEN"] = "JPY";
    EInvoiceCurrencyType["YUAN_RENMINBI"] = "CNY";
    EInvoiceCurrencyType["ZIMBABWE_DOLLAR"] = "ZWD";
    EInvoiceCurrencyType["ZLOTY"] = "PLN";
})(EInvoiceCurrencyType || (EInvoiceCurrencyType = {}));
var EInvoiceCurrencyType$1 = EInvoiceCurrencyType;

var InvoiceApprovalStatus;
(function (InvoiceApprovalStatus) {
    InvoiceApprovalStatus["APPROVED"] = "Onayland\u0131";
    InvoiceApprovalStatus["UNAPPROVED"] = "Onaylanmad\u0131";
    InvoiceApprovalStatus["DELETED"] = "Silinmi\u015F";
})(InvoiceApprovalStatus || (InvoiceApprovalStatus = {}));
var InvoiceApprovalStatus$1 = InvoiceApprovalStatus;

function mappingDraftInvoiceKeys(payload) {
    if (!isPlainObject(payload)) {
        throw new EInvoiceTypeError('Geçersiz fatura yükü.');
    }
    const { documentNumber = '', date, time, currency = EInvoiceCurrencyType$1.TURK_LIRASI, currencyRate = 0, invoiceType = InvoiceType$1.SATIS, whichType = '5000/30000', taxOrIdentityNumber = '11111111111', buyerTitle = '', buyerFirstName = '', buyerLastName = '', buildingName = '', buildingNumber = '', doorNumber = '', town = '', taxOffice = '', country = EInvoiceCountry$1.TURKIYE, fullAddress = '', district = '', city = '', postNumber = '', phoneNumber = '', faxNumber = '', email = '', website = '', refundTable = [], specialBaseAmount = 0, specialBasePercent = 0, specialBaseTaxAmount = 0, taxType = ' ', products, type = 'İskonto', base, productsTotalPrice, totalDiscountOrIncrement = 0, calculatedVAT = 0, totalTaxes = 0, includedTaxesTotalPrice, paymentPrice, note = '', orderNumber = '', orderDate = '', waybillNumber = '', waybillDate = '', receiptNumber = '', receiptDate = '', receiptTime = '', receiptType = '', zReportNumber = '', okcSerialNumber = '', ...other } = payload;
    greaterThanValidator(base, 0, 'base');
    greaterThanValidator(paymentPrice, 0, 'paymentPrice');
    greaterThanValidator(productsTotalPrice, 0, 'productsTotalPrice');
    greaterThanValidator(includedTaxesTotalPrice, 0, 'includedTaxesTotalPrice');
    return {
        ...other,
        faturaUuid: '',
        belgeNumarasi: documentNumber,
        faturaTarihi: getDateFormat(date),
        saat: getDateFormat(time, 'time'),
        paraBirimi: currency,
        dovzTLkur: currencyRate.toString(),
        faturaTipi: invoiceType,
        hangiTip: whichType,
        vknTckn: taxOrIdentityNumber,
        aliciUnvan: buyerTitle,
        aliciAdi: buyerFirstName,
        aliciSoyadi: buyerLastName,
        binaAdi: buildingName,
        binaNo: buildingNumber,
        kapiNo: doorNumber,
        kasabaKoy: town,
        vergiDairesi: taxOffice,
        ulke: country,
        mahalleSemtIlce: district,
        bulvarcaddesokak: fullAddress,
        sehir: city,
        postaKodu: postNumber,
        tel: phoneNumber,
        fax: faxNumber,
        eposta: email,
        websitesi: website,
        iadeTable: refundTable.map((refund, index) => {
            const { invoiceNumber, date, ...other } = refund;
            notEmptyStringValidator(invoiceNumber, `refundTable[${index}].invoiceNumber`);
            return {
                ...other,
                faturaNo: invoiceNumber,
                duzenlenmeTarihi: getDateFormat(date)
            };
        }),
        ozelMatrahTutari: specialBaseAmount.toString(),
        ozelMatrahOrani: specialBasePercent,
        ozelMatrahVergiTutari: specialBaseTaxAmount.toString(),
        vergiCesidi: taxType,
        malHizmetTable: products.map((product, index) => {
            const { name, quantity = 1, unitType = EInvoiceUnitType$1.ADET, unitPrice, price, vatRate = 0, taxRate = 0, totalAmount, vatAmount = 0, vatAmountOfTax = 0, specialBaseAmount = 0, discountOrIncrement = 'İskonto', discountOrIncrementRate = 0, discountOrIncrementAmount = 0, discountOrIncrementReason = '', ...other } = product;
            notEmptyStringValidator(name, `products[${index}].name`);
            greaterThanValidator(price, 0, `products[${index}].price`);
            greaterThanValidator(quantity, 0, `products[${index}].quantity`);
            greaterThanValidator(unitPrice, 0, `products[${index}].unitPrice`);
            greaterThanValidator(totalAmount, 0, `products[${index}].totalAmount`);
            return {
                ...other,
                malHizmet: name,
                miktar: quantity,
                birim: unitType,
                birimFiyat: unitPrice.toString(),
                fiyat: price.toString(),
                iskontoArttm: discountOrIncrement,
                iskontoOrani: discountOrIncrementRate,
                iskontoTutari: discountOrIncrementAmount.toString(),
                iskontoNedeni: discountOrIncrementReason,
                malHizmetTutari: totalAmount.toString(),
                kdvOrani: vatRate.toString(),
                kdvTutari: vatAmount.toString(),
                vergiOrani: taxRate,
                vergininKdvTutari: vatAmountOfTax.toString(),
                ozelMatrahTutari: specialBaseAmount.toString()
            };
        }),
        tip: type,
        matrah: base.toString(),
        malhizmetToplamTutari: productsTotalPrice.toString(),
        toplamIskonto: totalDiscountOrIncrement.toString(),
        hesaplanankdv: calculatedVAT.toString(),
        vergilerToplami: totalTaxes.toString(),
        vergilerDahilToplamTutar: includedTaxesTotalPrice.toString(),
        odenecekTutar: paymentPrice.toString(),
        not: note || `YALNIZ ${paymentPriceToText(paymentPrice)}`,
        siparisNumarasi: orderNumber,
        siparisTarihi: orderDate ? getDateFormat(orderDate) : '',
        irsaliyeNumarasi: waybillNumber,
        irsaliyeTarihi: waybillDate ? getDateFormat(waybillDate) : '',
        fisNo: receiptNumber,
        fisTarihi: receiptDate ? getDateFormat(receiptDate) : '',
        fisSaati: receiptTime,
        fisTipi: receiptType,
        zRaporNo: zReportNumber,
        okcSeriNo: okcSerialNumber
    };
}

function mappingBasicInvoiceKeys(value, mappingWithTurkishKeys) {
    if (!isPlainObject(value)) {
        throw new EInvoiceTypeError('Geçersiz fatura verisi.');
    }
    if (mappingWithTurkishKeys) {
        const { uuid = '', documentNumber = '', taxOrIdentityNumber = '', titleOrFullName = '', documentDate = '', documentType = '', approvalStatus = '', ...other } = value;
        return {
            ...other,
            ettn: uuid,
            belgeNumarasi: documentNumber,
            aliciVknTckn: taxOrIdentityNumber,
            aliciUnvanAdSoyad: titleOrFullName,
            belgeTarihi: documentDate,
            belgeTuru: documentType,
            onayDurumu: approvalStatus
        };
    }
    const { ettn: uuid = '', belgeNumarasi: documentNumber = '', aliciVknTckn: taxOrIdentityNumber = '', aliciUnvanAdSoyad: titleOrFullName = '', belgeTarihi: documentDate = '', belgeTuru: documentType = '', onayDurumu: approvalStatus = '', ...other } = value;
    return {
        ...other,
        uuid,
        documentNumber,
        taxOrIdentityNumber,
        titleOrFullName,
        documentDate,
        documentType,
        approvalStatus
    };
}

function mappingUserInformationKeys(value, mappingWithTurkishKeys) {
    if (!isPlainObject(value)) {
        throw new EInvoiceTypeError('Kullanıcı bilgisi verisi mevcut değil.');
    }
    if (mappingWithTurkishKeys) {
        const { title = '', firstName = '', lastName = '', taxOrIdentityNumber = '', email = '', website = '', recordNumber = '', mersisNumber = '', taxOffice = '', street = '', buildingName = '', buildingNumber = '', doorNumber = '', town = '', city = '', district = '', postNumber = '', country = '', phoneNumber = '', faxNumber = '', businessCenter = '', ...other } = value;
        return {
            ...other,
            unvan: title,
            ad: firstName,
            soyad: lastName,
            vknTckn: taxOrIdentityNumber,
            ePostaAdresi: email,
            webSitesiAdresi: website,
            sicilNo: recordNumber,
            mersisNo: mersisNumber,
            vergiDairesi: taxOffice,
            cadde: street,
            apartmanAdi: buildingName,
            apartmanNo: buildingNumber,
            kapiNo: doorNumber,
            kasaba: town,
            il: city,
            ilce: district,
            postaKodu: postNumber,
            ulke: country,
            telNo: phoneNumber,
            faksNo: faxNumber,
            isMerkezi: businessCenter
        };
    }
    const { unvan: title = '', ad: firstName = '', soyad: lastName = '', vknTckn: taxOrIdentityNumber = '', ePostaAdresi: email = '', webSitesiAdresi: website = '', sicilNo: recordNumber = '', mersisNo: mersisNumber = '', vergiDairesi: taxOffice = '', cadde: street = '', apartmanAdi: buildingName = '', apartmanNo: buildingNumber = '', kapiNo: doorNumber = '', kasaba: town = '', il: city = '', ilce: district = '', postaKodu: postNumber = '', ulke: country = '', telNo: phoneNumber = '', faksNo: faxNumber = '', isMerkezi: businessCenter = '', ...other } = value;
    return {
        ...other,
        title,
        firstName,
        lastName,
        taxOrIdentityNumber,
        email,
        website,
        recordNumber,
        mersisNumber,
        taxOffice,
        street,
        buildingName,
        buildingNumber,
        doorNumber,
        town,
        city,
        district,
        postNumber,
        country,
        phoneNumber,
        faxNumber,
        businessCenter
    };
}

function mappingCompanyInformationKeys(value, mappingWithTurkishKeys) {
    if (!isPlainObject(value)) {
        throw new EInvoiceTypeError('Şirket bilgisi verisi mevcut değil.');
    }
    const { unvan: title = '', adi: firstName = '', soyadi: lastName = '', vergiDairesi: taxOffice = '', ...other } = value;
    return {
        ...other,
        title,
        firstName,
        lastName,
        taxOffice
    };
}

function mappingBasicInvoiceIssuedToMeKeys(value, mappingWithTurkishKeys) {
    if (!isPlainObject(value)) {
        throw new EInvoiceTypeError('Geçersiz fatura verisi.');
    }
    if (mappingWithTurkishKeys) {
        const { uuid = '', documentNumber = '', taxOrIdentityNumber = '', titleOrFullName = '', documentDate = '', documentType = '', approvalStatus = '', ...other } = value;
        return {
            ...other,
            ettn: uuid,
            belgeNumarasi: documentNumber,
            saticiVknTckn: taxOrIdentityNumber,
            saticiUnvanAdSoyad: titleOrFullName,
            belgeTarihi: documentDate,
            belgeTuru: documentType,
            onayDurumu: approvalStatus
        };
    }
    const { ettn: uuid = '', belgeNumarasi: documentNumber = '', saticiVknTckn: taxOrIdentityNumber = '', saticiUnvanAdSoyad: titleOrFullName = '', belgeTarihi: documentDate = '', belgeTuru: documentType = '', onayDurumu: approvalStatus = '', ...other } = value;
    return {
        ...other,
        uuid,
        documentNumber,
        taxOrIdentityNumber,
        titleOrFullName,
        documentDate,
        documentType,
        approvalStatus
    };
}

function paramsToArgs(params, name) {
    const args = [];
    for (const key in params) {
        args.push(`--${name}`, key, `${params[key]}`);
    }
    return args;
}
function xsltproc(args, options) {
    const { params = {}, stringParams = {}, xsltprocExecutablePath = '/usr/bin/xsltproc' } = options || {};
    return new Promise((resolve, reject) => {
        const cmd = spawn(xsltprocExecutablePath, [
            ...paramsToArgs(params, 'param'),
            ...paramsToArgs(stringParams, 'stringparam'),
            ...args
        ], {
            env: process.env,
            shell: process.platform === 'win32'
        });
        const chunks = [];
        cmd.on('error', (err) => {
            reject(err);
        });
        cmd.stdout.on('data', (data) => {
            chunks.push(Buffer.from(data));
        });
        cmd.stdout.on('close', () => {
            resolve(Buffer.concat(chunks));
        });
    });
}

function isEInvoiceApiResponseError(value) {
    return (isPlainObject(value) && value.error === '1' && Array.isArray(value.messages));
}

class XsltRenderer {
    xsltFilePath;
    getXmlBuffer;
    xsltprocOptions;
    xmlBuffer;
    constructor(xsltFilePath, getXmlBuffer, xsltprocOptions) {
        this.xsltFilePath = xsltFilePath;
        this.getXmlBuffer = getXmlBuffer;
        this.xsltprocOptions = xsltprocOptions;
    }
    /**
     * XSLT şablonunun pdf çıktısını verir.
     */
    async toPdf(options) {
        const htmlBuffer = await this.toHtml();
        return htmlToPdf(htmlBuffer.toString('utf-8'), options);
    }
    /**
     * XSLT şablonunun html çıktısını verir.
     */
    toHtml() {
        return this.render();
    }
    /**
     * İlgili faturaya ait xml çıktısını verir.
     */
    async toXml() {
        if (!this.xmlBuffer) {
            this.xmlBuffer = await this.getXmlBuffer();
        }
        if (!this.xmlBuffer) {
            throw new EInvoiceTypeError('Faturaya ait xml içeriği yüklenemedi.');
        }
        const filename = path.basename(this.xsltFilePath);
        const xsltBase64String = await this.xsltToBase64Encoded();
        return Buffer.from(this.xmlBuffer
            .toString('utf-8')
            .replace(/<(cbc:EmbeddedDocumentBinaryObject)\s(.*?)\sfilename=".*">.*<\/cbc:EmbeddedDocumentBinaryObject>/g, `<$1 $2 filename="${filename}">${xsltBase64String}</$1>`));
    }
    /**
     * XSLT şablonunun içeriğini verir.
     */
    getXsltContent() {
        return fs.readFile(this.xsltFilePath);
    }
    /**
     * XSLT şablonunun base64 ile kodlanmış içeriğini verir.
     */
    xsltToBase64Encoded() {
        return fs.readFile(this.xsltFilePath, 'base64url');
    }
    async render() {
        const xmlTmpFile = await tmpFileAsync();
        const xmlBuffer = await this.toXml();
        await fs.writeFile(xmlTmpFile.name, xmlBuffer, 'utf-8');
        return xsltproc([this.xsltFilePath, xmlTmpFile.name], this.xsltprocOptions).finally(() => xmlTmpFile.cleanup());
    }
}

const isTestEnv = process.env.NODE_ENV === 'test';
const allowLegacyRenegotiationForNodeJs = new https.Agent({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
});
const getAxiosRequestConfig = (config) => ({
    timeout: 10 * 1000,
    ...(!isTestEnv ? { httpsAgent: allowLegacyRenegotiationForNodeJs } : {}),
    ...config
});
class EInvoiceApi {
    testMode = false;
    token = null;
    username = null;
    password = null;
    static BASE_URL = 'https://earsivportal.efatura.gov.tr';
    static TEST_BASE_URL = 'https://earsivportaltest.efatura.gov.tr';
    static DISPATCH_PATH = '/earsiv-services/dispatch';
    static TOKEN_PATH = '/earsiv-services/assos-login';
    static REFERRER_PATH = '/intragiris.html';
    static DEFAULT_HEADERS = {
        Accept: '*/*',
        'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Pragma: 'no-cache',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36'
    };
    constructor(credentials) {
        if (credentials) {
            this.setCredentials(credentials);
        }
    }
    /**
     * Yeni bir e-Arşiv API örneği oluşturur.
     */
    static create(credentials) {
        return new EInvoiceApi(credentials);
    }
    /**
     * Var olan erişim jetonunu döndürür.
     */
    getToken() {
        return this.token;
    }
    /**
     * Var olan erişim jetonunu değiştirir.
     * @param value Erişim jetonu değeri.
     */
    setToken(value) {
        this.token = value;
        return this;
    }
    /**
     * Test modunun aktif olup olmadığı
     */
    get isTestMode() {
        return this.testMode;
    }
    /**
     * Test modunu aktif/deaktif eder.
     * @param value
     */
    setTestMode(value) {
        this.testMode = value;
        return this;
    }
    /**
     * Kullanıcı adı veya şifre bilgisini atamak için kullanılır.
     * @param value Kullanıcı adı veya şifre bilgisi.
     */
    setCredentials(value) {
        const { username, password } = value;
        if (typeof username !== 'undefined') {
            this.username = username;
        }
        if (typeof password !== 'undefined') {
            this.password = password;
        }
        return this;
    }
    /**
     * Mevcut olan kullanıcı adı ve şifre bilgisini getirir.
     */
    getCredentials() {
        return {
            username: this.username,
            password: this.password
        };
    }
    /**
     * e-Arşiv oturumunu başlatır.
     * @param options Bağlantı seçenekleri.
     */
    async connect(options) {
        if ('anonymous' in options && options.anonymous) {
            await this.setAnonymousCredentials();
        }
        else if ('username' in options && 'password' in options) {
            this.setTestMode(false);
            this.setCredentials(options);
        }
        await this.initAccessToken();
    }
    /**
     * e-Arşiv oturumunu sonlandırır.
     */
    async logout() {
        this.checkToken();
        const params = {
            rtype: 'json',
            token: this.token,
            assoscmd: 'logout'
        };
        await this.sendRequest(EInvoiceApi.TOKEN_PATH, params);
        this.setToken(null);
    }
    /**
     * e-Arşiv üxerinde kullanılacak erişim jetonunu alır.
     */
    async getAccessToken() {
        this.checkCredentials();
        const params = {
            rtype: 'json',
            userid: this.username,
            sifre: this.password,
            sifre2: this.password,
            parola: '1',
            assoscmd: this.testMode ? 'login' : 'anologin'
        };
        const data = await this.sendRequest(EInvoiceApi.TOKEN_PATH, params);
        if (typeof data.token !== 'string' || data.token === '') {
            throw new EInvoiceApiError('Geçersiz erişim jetonu.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVALID_ACCESS_TOKEN
            });
        }
        return data.token;
    }
    /**
     * Erişim jetonunu alır ve `this.token` değişkenine atar.
     */
    async initAccessToken() {
        this.setToken(await this.getAccessToken());
    }
    /**
     * e-Arşiv üzerinde bulunan bir faturayı UUID'ine göre getirir.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     */
    async getInvoice(invoiceOrUuid) {
        this.checkToken();
        const params = {
            cmd: 'EARSIV_PORTAL_FATURA_GETIR',
            callid: v1(),
            pageName: 'RG_BASITFATURA',
            token: this.token,
            jp: JSON.stringify({
                ettn: this.getInvoiceUuid(invoiceOrUuid)
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (!isPlainObject(data.data)) {
            throw new EInvoiceApiError('Fatura bulunamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVOICE_NOT_FOUND
            });
        }
        return mappingInvoiceKeys(data.data);
    }
    /**
     * Düzenlenen faturaları getirir.
     * @param filter Faturaları filtrelemek için.
     */
    async getBasicInvoices(filter) {
        this.checkToken();
        const { startDate, endDate, approvalStatus } = filter || {};
        const params = {
            cmd: 'EARSIV_PORTAL_TASLAKLARI_GETIR',
            callid: v1(),
            pageName: 'RG_BASITTASLAKLAR',
            token: this.token,
            jp: JSON.stringify({
                baslangic: getDateFormat(startDate),
                bitis: getDateFormat(endDate),
                hangiTip: '5000/30000',
                table: []
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (Array.isArray(data.data)) {
            return this.filterBasicInvoicesByApprovalStatus(data.data.map((invoice) => {
                return mappingBasicInvoiceKeys(invoice);
            }), approvalStatus);
        }
        return [];
    }
    /**
     * Adınıza düzenlenen faturaları getirir.
     * @param filter Faturaları filtrelemek için.
     */
    async getBasicInvoicesIssuedToMe(filter) {
        this.checkToken();
        const { startDate, endDate, approvalStatus, hourlySearchInterval = HourlySearchInterval$1.NONE } = filter || {};
        const startDateValue = getDateFormat(startDate);
        const endDateValue = getDateFormat(endDate);
        const params = {
            cmd: 'EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR',
            callid: v1(),
            pageName: 'RG_ALICI_TASLAKLAR',
            token: this.token,
            jp: JSON.stringify({
                baslangic: startDateValue,
                bitis: endDateValue,
                hourlySearchInterval: startDateValue === endDateValue
                    ? hourlySearchInterval
                    : HourlySearchInterval$1.NONE
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (Array.isArray(data.data)) {
            return this.filterBasicInvoicesByApprovalStatus(data.data.map((invoice) => {
                return mappingBasicInvoiceIssuedToMeKeys(invoice);
            }), approvalStatus);
        }
        return [];
    }
    /**
     * Faturayı UUID değerine göre bulur.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param filter Faturaları filtreleme seçenekleri.
     */
    async findBasicInvoice(invoiceOrUuid, filter) {
        const invoices = await this.getBasicInvoices(filter);
        const invoice = invoices.find((value) => value.uuid === this.getInvoiceUuid(invoiceOrUuid));
        if (!invoice) {
            throw new EInvoiceApiError('Fatura bulunamadı.', {
                data: undefined,
                errorCode: EInvoiceApiErrorCode$1.BASIC_INVOICE_NOT_FOUND
            });
        }
        return invoice;
    }
    /**
     * Faturanın html çıktısını getirir.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     * @param injectPrintScript HTML çıktısına `window.print()` komutunu ekler.
     */
    async getInvoiceHtml(invoiceOrUuid, signed = true, injectPrintScript = false) {
        this.checkToken();
        const params = {
            cmd: 'EARSIV_PORTAL_FATURA_GOSTER',
            callid: v1(),
            pageName: 'RG_TASLAKLAR',
            token: this.token,
            jp: JSON.stringify({
                ettn: this.getInvoiceUuid(invoiceOrUuid),
                onayDurumu: signed ? 'Onaylandı' : 'Onaylanmadı'
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (typeof data.data !== 'string' || data.data === '') {
            throw new EInvoiceApiError('Faturaya ait HTML içeriği alınamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVALID_INVOICE_HTML
            });
        }
        if (injectPrintScript) {
            return data.data.replace(/<\/(body|html)>/, '<script>window.print();</script></$1>');
        }
        return data.data;
    }
    /**
     * Faturayı PDF'e dönüştürür.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     * @param options PDF seçenekleri.
     */
    async getInvoicePdf(invoiceOrUuid, signed = true, options) {
        const html = await this.getInvoiceHtml(invoiceOrUuid, signed);
        return htmlToPdf(html, options);
    }
    /**
     * Faturayı zip formatına dönüştürür.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     */
    async getInvoiceZip(invoiceOrUuid, signed = true) {
        const invoiceUuid = this.getInvoiceUuid(invoiceOrUuid);
        const downloadUrl = this.getInvoiceDownloadUrl(invoiceUuid, signed);
        const { headers = {}, data: zipBuffer } = await axios.get(downloadUrl, getAxiosRequestConfig({
            responseType: 'arraybuffer'
        }));
        const contentDisposition = headers['content-disposition'];
        const expectedContentDisposition = `attachment; filename="${invoiceUuid}_f.zip"`;
        if (contentDisposition !== expectedContentDisposition) {
            throw new EInvoiceApiError('Geçersiz fatura zip dosyası yanıtı.', {
                data: undefined,
                errorCode: EInvoiceApiErrorCode$1.INVALID_INVOICE_ZIP_FILE_RESPONSE
            });
        }
        return zipBuffer;
    }
    /**
     * Faturayı xml formatına dönüştürür.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     */
    async getInvoiceXml(invoiceOrUuid, signed = true) {
        const { unzipSync } = await import('fflate');
        const invoiceUuid = this.getInvoiceUuid(invoiceOrUuid);
        const xmlFilename = `${invoiceUuid}_f.xml`;
        const zipBuffer = await this.getInvoiceZip(invoiceUuid, signed);
        const zipEntries = unzipSync(zipBuffer, {
            filter: (file) => file.name === xmlFilename
        });
        const xmlFileBytes = zipEntries[xmlFilename];
        if (!xmlFileBytes) {
            throw new EInvoiceApiError('Faturaya ait xml dosyası bulunamadı.', {
                data: undefined,
                errorCode: EInvoiceApiErrorCode$1.INVOICE_XML_FILE_NOT_FOUND
            });
        }
        return Buffer.from(xmlFileBytes);
    }
    /**
     * Faturanın indirilebilir bağlantısını verir.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     */
    getInvoiceDownloadUrl(invoiceOrUuid, signed = true) {
        this.checkToken();
        const query = {
            token: this.token,
            ettn: this.getInvoiceUuid(invoiceOrUuid),
            belgeTip: 'FATURA',
            cmd: 'EARSIV_PORTAL_BELGE_INDIR',
            onayDurumu: signed ? 'Onaylandı' : 'Onaylanmadı'
        };
        return `${this.getBaseURL()}/earsiv-services/download?${qs.stringify(query)}`;
    }
    /**
     * Belirli bir faturayı XSLT şablonu ile derlemenize olanak tanır.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param xsltFilePath XSLT şablonun yolu.
     * @param options XSLT şablonu derlemesi ve fatura ile ilgili seçenekler.
     */
    invoiceXsltRenderer(invoiceOrUuid, xsltFilePath, options) {
        const { signed = true, xsltprocOptions } = options || {};
        return new XsltRenderer(xsltFilePath, this.getInvoiceXml.bind(this, invoiceOrUuid, signed), xsltprocOptions);
    }
    /**
     * e-Arşiv kullanıcı (şirket) bilgilerini getirir.
     */
    async getUserInformation() {
        this.checkToken();
        const params = {
            cmd: 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR',
            callid: v1(),
            pageName: 'RG_KULLANICI',
            token: this.token,
            jp: '{}'
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (!isPlainObject(data.data)) {
            throw new EInvoiceApiError('Kullanıcı (şirket) bilgisi bulunamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.USER_INFORMATION_NOT_FOUND
            });
        }
        return mappingUserInformationKeys(data.data);
    }
    /**
     * e-Arşiv kullanıcı (şirket) bilgilerini günceller.
     * @param payload Güncellemeye ait yük.
     */
    async updateUserInformation(payload) {
        this.checkToken();
        const userInformation = await this.getUserInformation();
        const newUserInformation = {
            ...userInformation,
            ...payload
        };
        const params = {
            cmd: 'EARSIV_PORTAL_KULLANICI_BILGILERI_KAYDET',
            callid: v1(),
            pageName: 'RG_KULLANICI',
            token: this.token,
            jp: JSON.stringify(mappingUserInformationKeys(newUserInformation, true))
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (typeof data.data !== 'string' ||
            data.data !== 'Bilgileriniz başarıyla güncellendi.') {
            throw new EInvoiceApiError('Kullanıcı (şirket) bilgileri güncellenemedi.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.USER_INFORMATION_NOT_UPDATED
            });
        }
        return newUserInformation;
    }
    /**
     * Vergi Kimlik No veya T.C Kimlik No'ya göre tüzel veya gerçek kişilerin şirket bilgisini alır.
     * @param taxOrIdentityNumber Vergi Kimlik No veya T.C Kimlik No
     */
    async getCompanyInformation(taxOrIdentityNumber) {
        this.checkToken();
        const params = {
            cmd: 'SICIL_VEYA_MERNISTEN_BILGILERI_GETIR',
            callid: v1(),
            pageName: 'RG_BASITFATURA',
            token: this.token,
            jp: JSON.stringify({
                vknTcknn: taxOrIdentityNumber
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (!isPlainObject(data.data)) {
            throw new EInvoiceApiError('Şirket bilgisi bulunamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.COMPANY_INFORMATION_NOT_FOUND
            });
        }
        return mappingCompanyInformationKeys(data.data);
    }
    /**
     * e-Arşiv üzerinde kayıtlı olan telefon numarasını getirir.
     */
    async getSavedPhoneNumber() {
        this.checkToken();
        const params = {
            cmd: 'EARSIV_PORTAL_TELEFONNO_SORGULA',
            callid: v1(),
            pageName: 'RG_BASITTASLAKLAR',
            token: this.token,
            jp: '{}'
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (!isPlainObject(data.data) || !data.data.telefon) {
            throw new EInvoiceApiError('Kayıtlı telefon numarası bulunamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.SAVED_PHONE_NUMBER_NOT_FOUND
            });
        }
        return `${data.data.telefon}`;
    }
    /**
     * e-Arşiv üzerinde taslak fatura oluşturur.
     * @param payload Faturaya ait yük.
     */
    async createDraftInvoice(payload) {
        this.checkToken();
        const invoice = mappingDraftInvoiceKeys(payload);
        const params = {
            cmd: 'EARSIV_PORTAL_FATURA_OLUSTUR',
            callid: v1(),
            pageName: 'RG_BASITFATURA',
            token: this.token,
            jp: JSON.stringify(invoice)
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (typeof data.data !== 'string' ||
            !data.data.includes('Faturanız başarıyla oluşturulmuştur')) {
            throw new EInvoiceApiError('Fatura oluşturulamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.BASIC_INVOICE_NOT_CREATED
            });
        }
        return true;
    }
    /**
     * e-Arşiv üzerinde taslak olarak bulunan bir faturayı günceller.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param payload Güncelleme yükü.
     */
    async updateDraftInvoice(invoiceOrUuid, payload) {
        this.checkToken();
        const invoice = await this.getInvoice(invoiceOrUuid);
        const newInvoice = deepMerge(invoice, payload);
        const params = {
            cmd: 'EARSIV_PORTAL_FATURA_OLUSTUR',
            callid: v1(),
            pageName: 'RG_BASITFATURA',
            token: this.token,
            jp: JSON.stringify(mappingDraftInvoiceKeys(newInvoice))
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (typeof data.data !== 'string' ||
            !data.data.includes('Faturanız başarıyla oluşturulmuştur')) {
            throw new EInvoiceApiError('Fatura güncellenemedı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.BASIC_INVOICE_NOT_CREATED
            });
        }
        return newInvoice;
    }
    /**
     * e-Arşiv üzerinde taslak olarak bulunan bir faturayı siler.
     * @param invoice Fatura içeriği.
     * @param reason Silme nedeni.
     */
    async deleteDraftInvoice(invoice, reason) {
        this.checkToken();
        const params = {
            cmd: 'EARSIV_PORTAL_FATURA_SIL',
            callid: v1(),
            pageName: 'RG_TASLAKLAR',
            token: this.token,
            jp: JSON.stringify({
                silinecekler: [mappingBasicInvoiceKeys(invoice, true)],
                aciklama: reason
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (typeof data.data !== 'string') {
            throw new EInvoiceApiError('Basit fatura silinemedi.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.BASIC_INVOICE_NOT_DELETED
            });
        }
        return data.data.includes('fatura başarıyla silindi');
    }
    /**
     * e-Arşiv fatura iptal talebi oluşturur.
     * @param invoice Fatura içeriği.
     * @param reason İptal talebi nedeni.
     */
    async createCancelRequestForInvoice(invoice, reason) {
        this.checkToken();
        const params = {
            cmd: 'EARSIV_PORTAL_IPTAL_TALEBI_OLUSTUR',
            callid: v1(),
            pageName: 'RG_BASITTASLAKLAR',
            token: this.token,
            jp: JSON.stringify({
                ettn: invoice.uuid,
                onayDurumu: invoice.approvalStatus,
                belgeTuru: invoice.documentType,
                talepAciklama: reason
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (typeof data.data !== 'string') {
            throw new EInvoiceApiError('Fatura iptal talebi oluşturulamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVOICE_CANCEL_REQUEST_NOT_CREATED
            });
        }
        return data.data.includes('İptal talebiniz başarıyla oluşturulmuş');
    }
    /**
     * @see EInvoiceApi.getSavedPhoneNumber()
  
     * Fatura imzalamak için SMS ile doğrulama kodu gönderilir.
     * Ayrıca, doğrulamaya ait işlem kimliği ve kodun gönderildiği telefon numarası geri döner.
     */
    async sendSMSCode() {
        this.checkToken();
        const phoneNumber = await this.getSavedPhoneNumber();
        const params = {
            cmd: 'EARSIV_PORTAL_SMSSIFRE_GONDER',
            callid: v1(),
            pageName: 'RG_SMSONAY',
            token: this.token,
            jp: JSON.stringify({
                CEPTEL: phoneNumber,
                KCEPTEL: false,
                TIP: ''
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (!isPlainObject(data.data) ||
            typeof data.data.oid !== 'string' ||
            data.data.oid === '') {
            throw new EInvoiceApiError('Geçersiz SMS işlem kimliği.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVALID_SMS_OPERATION_ID
            });
        }
        return {
            oid: data.data.oid,
            phoneNumber
        };
    }
    /**
     * e-Arşiv üzerinde bulunan faturaları imzalar.
     * @see EInvoiceApi.sendSMSCode()
     * @param code e-Arşiv üzerinde kayıtlı olan telefon numarasına gelen doğrulama kodu.
     * @param oid `EInvoiceApi.sendSMSCode()` ile alınan işlem kimliği.
     * @param invoices İmzalanacak fatura(lar).
     */
    async signInvoices(code, oid, invoices) {
        this.checkToken();
        const params = {
            cmd: '0lhozfib5410mp',
            callid: v1(),
            pageName: 'RG_SMSONAY',
            token: this.token,
            jp: JSON.stringify({
                SIFRE: code,
                OID: oid,
                OPR: 1,
                DATA: toArray(invoices).map((value) => {
                    return mappingBasicInvoiceKeys(value, true);
                })
            })
        };
        const data = await this.sendRequest(EInvoiceApi.DISPATCH_PATH, params);
        if (!isPlainObject(data.data) || !data.data.sonuc) {
            throw new EInvoiceApiError('Temel faturalar imzalanamadı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.BASIC_INVOICES_COULD_NOT_SIGNED
            });
        }
        return `${data.data.sonuc}` === '1';
    }
    /**
     * e-Arşiv'e anonim olarak bağlanmak için kullanıcı adı ve şifre getirir.
     */
    async getAnonymousCredentials() {
        const params = {
            rtype: 'json',
            assoscmd: 'kullaniciOner'
        };
        const data = await this.sendRequest('/earsiv-services/esign', params);
        if (typeof data.userid !== 'string' || data.userid === '') {
            throw new EInvoiceApiError('Geçersiz anonim kullanıcı kimliği.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVALID_ANONYMOUS_USER_ID
            });
        }
        return {
            username: data.userid,
            password: '1'
        };
    }
    /**
     * e-Arşiv'e anonim olarak bağlanmak için kullanıcı adı ve şifre uygular.
     */
    async setAnonymousCredentials() {
        this.setTestMode(true);
        this.setCredentials(await this.getAnonymousCredentials());
    }
    /**
     * Faturanın UUID'ini alır.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     */
    getInvoiceUuid(invoiceOrUuid) {
        if (typeof invoiceOrUuid === 'string') {
            return invoiceOrUuid;
        }
        return invoiceOrUuid.uuid;
    }
    /**
     * Faturaları onay durumuna göre filtreler.
     * @param invoices Filtrelenecek faturalar.
     * @param status Onay durumu.
     */
    filterBasicInvoicesByApprovalStatus(invoices, status) {
        if (typeof status !== 'string') {
            return invoices;
        }
        return invoices.filter((value) => status === value.approvalStatus);
    }
    async sendRequest(url, params, config) {
        const baseURL = this.getBaseURL();
        const { data } = await axios.post(url, qs.stringify(params), getAxiosRequestConfig({
            ...config,
            baseURL,
            headers: {
                ...EInvoiceApi.DEFAULT_HEADERS,
                Referrer: `${baseURL}${EInvoiceApi.REFERRER_PATH}`,
                ...config?.headers
            }
        }));
        if (!isPlainObject(data)) {
            throw new EInvoiceApiError('Geçersiz API cevabı.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.INVALID_RESPONSE
            });
        }
        if ('error' in data || (isPlainObject(data.data) && data.data.hata)) {
            if (isEInvoiceApiResponseError(data)) {
                const isSessionTimeoutError = data.messages.some((message) => message.type === '4');
                if (isSessionTimeoutError) {
                    throw new EInvoiceApiError('e-Arşiv oturumu zaman aşımına uğradı.', {
                        data,
                        errorCode: EInvoiceApiErrorCode$1.SESSION_TIMEOUT
                    });
                }
            }
            throw new EInvoiceApiError('Bilinmeyen bir hata oluştu.', {
                data,
                errorCode: EInvoiceApiErrorCode$1.UNKNOWN_ERROR
            });
        }
        return data;
    }
    getBaseURL() {
        return this.testMode ? EInvoiceApi.TEST_BASE_URL : EInvoiceApi.BASE_URL;
    }
    checkToken() {
        if (!this.token) {
            throw new EInvoiceMissingTokenError(`Erişim jetonu sağlanmamış. (${this.connect.name}, ${this.getAccessToken.name}) metodlarından birini kullanmayı deneyin.`);
        }
    }
    checkCredentials() {
        if (!this.username || !this.password) {
            throw new EInvoiceMissingCredentialsError(`Kullanıcı adı veya şifre sağlanmamış. (${this.connect.name}, ${this.setCredentials.name}, ${this.setAnonymousCredentials.name}) metodlarından birini kullanarak giriş bilgilerini sağlayın.`, this.getCredentials());
        }
    }
}

const EInvoice = EInvoiceApi.create();

export { EInvoice, EInvoiceApi, EInvoiceApiError, EInvoiceApiErrorCode$1 as EInvoiceApiErrorCode, EInvoiceCountry$1 as EInvoiceCountry, EInvoiceCurrencyType$1 as EInvoiceCurrencyType, EInvoiceError, EInvoiceMissingCredentialsError, EInvoiceMissingTokenError, EInvoiceTypeError, EInvoiceUnitType$1 as EInvoiceUnitType, HourlySearchInterval$1 as HourlySearchInterval, InvoiceApprovalStatus$1 as InvoiceApprovalStatus, InvoiceType$1 as InvoiceType, XsltRenderer, EInvoice as default, getDateFormat, isEInvoiceApiResponseError, mappingBasicInvoiceIssuedToMeKeys, mappingBasicInvoiceKeys, paymentPriceToText };
