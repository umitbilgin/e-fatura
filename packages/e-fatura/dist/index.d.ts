import { PDFOptions } from 'puppeteer-core';
import { ConvertToTextOptions } from 'number-to-text';

declare function getDateFormat(value?: Date | string, format?: 'date' | 'time'): string;

type PdfOptions = Omit<PDFOptions, 'path'> & {
    args?: string[];
};

declare function paymentPriceToText(paymentPrice: number, options?: ConvertToTextOptions): string;

declare enum InvoiceType {
    SATIS = "SATIS",
    IADE = "IADE",
    TEVKIFAT = "TEVKIFAT",
    ISTISNA = "ISTISNA",
    OZEL_MATRAH = "OZELMATRAH",
    IHRAC_KAYITLI = "IHRACKAYITLI",
    HAL_TIPI_FATURA_SATIS = "HKSSATIS",
    HAL_TIPI_FATURA_KOMISYONCU = "HKSKOMISYONCU"
}

declare enum EInvoiceCountry {
    TURKIYE = "T\u00FCrkiye",
    ABD_MINOR_OUTLYING_A = "Abd Minor Outlying A",
    ABD_VIRJIN_ADALARI = "Abd Virjin Adalar\u0131",
    AFGANISTAN = "Afganistan",
    ALMANYA = "Almanya",
    AMERIKA_BIRLESIK_DEV = "Amerika Birle\u015Fik Dev",
    AMERIKA_SAMOASI = "Amerika Samoasi",
    ANDORRA = "Andorra",
    ANGOLA = "Angola",
    ANGUILLA = "Anguilla",
    ANTARTIKA = "Antartika",
    ANTIGUA_VE_BERMUDA = "Antigua Ve Bermuda",
    ARJANTIN = "Arjantin",
    ARNAVUTLUK = "Arnavutluk",
    ARUBA = "Aruba",
    AVUSTRALYA = "Avustralya",
    AVUSTRALYA_OKYANUSU = "Avustralya Okyanusu",
    AVUSTURYA = "Avusturya",
    AZERBEYCAN = "Azerbeycan-Nah\u00E7ivan",
    BAHAMALAR = "Bahamalar",
    BAHREYN = "Bahreyn",
    BANGLADES = "Banglade\u015F",
    BARBADOS = "Barbados",
    BELCIKA = "Bel\u00E7ika",
    BELIZE = "Belize",
    BENIN = "Benin",
    BERMUDA = "Bermuda",
    BEYAZ_RUSYA = "Beyaz Rusya",
    BHUTAN = "Bhutan",
    BOLIVYA = "Bolivya",
    BOSNA = "Bosna-Hersek",
    BOSTVANA = "Bostvana",
    BOUVET_ADASI = "Bouvet Adas\u0131",
    BREZILYA = "Brezilya",
    BRUNEI = "Brunei",
    BULGARISTAN = "Bulgaristan",
    BURKINA_FASO = "Burkina Faso",
    BURMA = "Burma",
    BURUNDI = "Burundi",
    BIRLESIK_ARAP_EMIRLI = "Birle\u015Fik Arap Emirli",
    BIRLESIK_DEVLETLER_M = "Birle\u015Fik Devletler M",
    BIRLESIK_KRALLIK = "Birle\u015Fik Krallik",
    BISMARK_ARCHIPELAGO = "Bismark Archipelago",
    CAPE_VERDE = "Cape Verde",
    CAYMAN_ADALARI = "Cayman Adalar\u0131",
    CEBELI_TARIK = "Cebeli Tarik",
    CEUTA_VE_MELILLA = "Ceuta Ve Melilla",
    CEZAYIR = "Cezayir",
    CHRISTMAS_ADALARI = "Christmas Adalar\u0131",
    COOK_ADALARI = "Cook Adalar\u0131",
    CIBUTI = "Cibuti",
    CAD = "\u00C7ad",
    CEK_CUMHURIYETI = "\u00C7ek Cumhuriyeti",
    CECEN_CUMHURIYETI = "\u00C7e\u00E7en Cumhuriyeti",
    CIN_HALK_CUMHURIYETI = "\u00C7in Halk Cumhuriyeti",
    DANIMARKA = "Danimarka",
    DAGISTAN_CUMHURIYETI = "Da\u011Fistan Cumhuriyeti",
    DOMINIK_CUMHURIYETI = "Dominik Cumhuriyeti",
    DOMINIKA = "Dominika",
    DOGU_TIMOR = "Do\u011Fu Timor",
    DUBAI = "Dubai",
    EKVATOR = "Ekvator",
    EKVATOR_GINESI = "Ekvator Ginesi",
    EL_SALVADOR = "El Salvador",
    ENDONEZYA = "Endonezya",
    ERMENISTAN = "Ermenistan",
    ERITRE = "Eritre",
    ESTONYA = "Estonya",
    ETIYOPYA = "Etiyopya",
    FALKLAND_ADALARI = "Falkland Adalar\u0131",
    FAROE_ADALARI = "Faroe Adalar\u0131",
    FAS = "Fas",
    FRANSA = "Fransa",
    FRANSIZ_GUYANASI = "Fransiz Guyanasi",
    FRANSIZ_GUNEY_TOPRAK = "Fransiz G\u00FCney Toprak",
    FRANSIZ_POLINEZYASI = "Fransiz Polinezyasi",
    FIJI = "Fiji",
    FILDISI_SAHILI = "Fildi\u015Fi Sahili",
    FILIPINLER = "Filipinler",
    FILISTIN = "Filistin",
    FINLANDIYA = "Finlandiya",
    GABON = "Gabon",
    GAMBIYA = "Gambiya",
    GANA = "Gana",
    GRENADA = "Grenada",
    GRONLAND = "Gr\u00F6nland",
    GUADELUP = "Guadelup",
    GUAM = "Guam",
    GUATEMALA = "Guatemala",
    GUYANA = "Guyana",
    GUNEY_AFRIKA_CUMHURI = "G\u00FCney Afrika Cumhuri",
    GUNEY_FRANSIZ_TOPRAK = "G\u00FCney Fransiz Toprak",
    GUNEY_GEORGIA_VE_GUN = "G\u00FCney Georgia Ve G\u00FCn",
    GUNEY_KORE_CUMHURIYE = "G\u00FCney Kore Cumhuriye",
    GUNEY_YEMEN = "G\u00FCney Yemen",
    GURCISTAN = "G\u00FCrcistan",
    GINE = "Gine",
    GINEBISSAU = "Gine-Bissau",
    HAITI = "Haiti",
    HEARD_ADALARI_VE_MC = "Heard Adalar\u0131 Ve Mc",
    HIRVATISTAN = "Hirvatistan",
    HOLLANDA = "Hollanda",
    HOLLANDA_ANTILLERI = "Hollanda Antilleri",
    HONDURAS = "Honduras",
    HONG_KONG = "Hong Kong",
    HINDISTAN = "Hindistan",
    IRAK = "Irak",
    INGILIZ_HINT_OKYTOP = "\u0130ngiliz Hint Oky.Top",
    INGILIZ_VIRGIN_ADALA = "\u0130ngiliz Virgin Adala",
    IRAN = "\u0130ran",
    IRLANDA = "\u0130rlanda",
    ISPANYA = "\u0130spanya",
    ISRAIL = "\u0130srail",
    ISVEC = "\u0130sve\u00E7",
    ISVICRE = "\u0130svi\u00E7re",
    ITALYA = "\u0130talya",
    IZLANDA = "\u0130zlanda",
    ISGAL_ALTINDAKI_FILI = "\u0130\u015Fgal Altindaki Fili",
    JAMAIKA = "Jamaika",
    JAPONYA = "Japonya",
    KAMBOCYA = "Kambo\u00E7ya",
    KAMERUN = "Kamerun",
    KANADA = "Kanada",
    KARADAG = "Karada\u011F",
    KATAR = "Katar",
    KAZAKISTAN = "Kazakistan",
    KENYA = "Kenya",
    KIBRIS_RUM_KESIMI = "Kibris Rum Kesimi",
    KIRGIZISTAN = "Kirgizistan",
    KOKOS_ADALARI = "Kokos Adalar\u0131",
    KOLOMBIYA = "Kolombiya",
    KOMORO_ADALARI = "Komoro Adalar\u0131",
    KONGO = "Kongo",
    KOSOVA = "Kosova",
    KOSTA_RIKA = "Kosta Rika",
    KUTUP_BOLGELERI = "Kutup B\u00F6lgeleri",
    KUVEYT = "Kuveyt",
    KUZEY_KIBRIS_TURK_CU = "Kuzey Kibris T\u00FCrk Cu",
    KUZEY_KORE_DEMOKRATI = "Kuzey Kore Demokrati",
    KUZEY_MARIANA_ADALAR = "Kuzey Mariana Adalar",
    KUZEY_YEMEN = "Kuzey Yemen",
    KONGO_DEMOKRATIK_CU = "Kongo (Demokratik Cu)",
    KUBA = "K\u00FCba",
    KIRIBATI = "Kiribati",
    LAOS = "Laos",
    LESOTHO = "Lesotho",
    LETONYA = "Letonya",
    LIESHTENSTEIN = "Lieshtenstein",
    LUBNAN = "L\u00FCbnan",
    LUKSEMBURG = "L\u00FCksemburg",
    LIBERYA = "Liberya",
    LIBYA = "Libya",
    LITVANYA = "Litvanya",
    MACARISTAN = "Macaristan",
    MADAGASKAR = "Madagaskar",
    MAKAO = "Makao",
    MAKEDONYA = "Makedonya",
    MALAVI = "Malavi",
    MALDIV_ADALARI = "Maldiv Adalar\u0131",
    MALEZYA = "Malezya",
    MALTA = "Malta",
    MALI = "Mali",
    MARSHALL_ADALARI = "Marshall Adalar\u0131",
    MARTINIK = "Martinik",
    MAURITIUS = "Mauritius",
    MAYOTTE = "Mayotte",
    MEKSIKA = "Meksika",
    MELILLA = "Melilla",
    MISIR = "Misir",
    MOLDAVYA = "Moldavya",
    MONACO = "Monaco",
    MONTSERRAT = "Montserrat",
    MORITANYA = "Moritanya",
    MOZAMBIK = "Mozambik",
    MOGOLISTAN = "Mo\u011Folistan",
    MYANMAR = "Myanmar",
    MIKRONEZYA = "Mikronezya",
    NAMIBYA = "Namibya",
    NAURU = "Nauru",
    NEPAL = "Nepal",
    NORFOLK_ADASI = "Norfolk Adas\u0131",
    NORVEC = "Norve\u00E7",
    NIJER = "Nijer",
    NIJERYA = "Nijerya",
    NIKARAGUA = "Nikaragua",
    NIUE = "Niue",
    ORTA_AFRIKA_CUMHURIY = "Orta Afrika Cumhuriy",
    OZBEKISTAN = "\u00D6zbekistan",
    PAKISTAN = "Pakistan",
    PALAU = "Palau",
    PANAMA = "Panama",
    PAPUA_YENI_GINE = "Papua Yeni Gine",
    PARAGUAY = "Paraguay",
    PERU = "Peru",
    POLONYA = "Polonya",
    PORTEKIZ = "Portekiz",
    PITCAIRN = "Pitcairn",
    REUNION = "Reunion",
    ROMANYA = "Romanya",
    RUANDA = "Ruanda",
    RUSYA_FEDERASYONU = "Rusya Federasyonu",
    SAN_MARINO = "San Marino",
    SAO_TOME_AND_PRINCIP = "Sao Tome And Princip",
    SENEGAL = "Senegal",
    SEPTECEUTA = "Septe(Ceuta)",
    SEYSEL_ADALARI_VE_BA = "Sey\u015Fel Adalar\u0131 Ve Ba",
    SIERRA_LEONE = "Sierra Leone",
    SIRBISTAN = "Sirbistan",
    SLOVAKYA = "Slovakya",
    SLOVENYA = "Slovenya",
    SOLOMON_ADALARI = "Solomon Adalar\u0131",
    SOMALI = "Somali",
    SRI_LANKA = "Sri Lanka",
    ST_VINCENT_VE_GRENAD = "St Vincent Ve Grenad",
    ST_HELENA_VE_BAGLAN = "St. Helena Ve Ba\u011Flan",
    ST_KITTS_VE_NEVIS = "St. Kitts Ve Nevis",
    ST_LUCIA = "St. Lucia",
    ST_PIERRE_VE_MIQUEL = "St. Pierre Ve Miquel",
    SUDAN = "Sudan",
    SURINAM = "Surinam",
    SURIYE = "Suriye",
    SUUDI_ARABISTAN = "Suudi Arabistan",
    SVAZILAND = "Svaziland",
    SAMOA_BATI_SAMOA = "Samoa (Bat\u0131 Samoa)",
    SERBEST_BOLGE_BA = "Serbest B\u00F6lge (Ba-Bs)",
    SINGAPUR = "Singapur",
    SILI = "\u015Eili",
    TACIKISTAN = "Tacikistan",
    TAYLAND = "Tayland",
    TAYVAN = "Tayvan",
    TOGO = "Togo",
    TOKELAU = "Tokelau",
    TONGA = "Tonga",
    TRINIDAD_VE_TOBAGO = "Trinidad Ve Tobago",
    TUNUS = "Tunus",
    TURKS_VE_CAICOS_ADAS = "Turks Ve Caicos Adas",
    TUVALU = "Tuvalu",
    TANZANYA_BIRLESIK_C = "Tanzanya (Birle\u015Fik C)",
    TURKMENISTAN = "T\u00FCrkmenistan",
    UGANDA = "Uganda",
    UKRAYNA = "Ukrayna",
    UMMAN = "Umman",
    URUGUAY = "Uruguay",
    URDUN = "\u00DCrd\u00FCn",
    VANUATU = "Vanuatu",
    VATIKAN = "Vatikan",
    VENEZUELLA = "Venezuella",
    VIETNAM = "Vietnam",
    WALLIS_VE_FUTUNA_ADA = "Wallis Ve Futuna Ada",
    YAKUTISTAN = "Yakutistan",
    YEMEN = "Yemen",
    YENI_KALODENYA_VE_BA = "Yeni Kalodenya Ve Ba",
    YENI_ZELANDA = "Yeni Zelanda",
    YENI_ZELANDA_OKYANUS = "Yeni Zelanda Okyanus",
    YUGOSLAVYAESKI_YUGO = "Yugoslavya(Eski Yugo)",
    YUGOSLAVYASIRBISTAN = "Yugoslavya(Sirbistan)",
    YUNANISTAN = "Yunanistan",
    ZAMBIA = "Zambia",
    ZIMBABVE = "Zimbabve"
}

declare enum EInvoiceUnitType {
    GUN = "DAY",
    AY = "MON",
    YIL = "ANN",
    SAAT = "HUR",
    DAKIKA = "D61",
    SANIYE = "D62",
    ADET = "C62",
    PAKET = "PA",
    KUTU = "BX",
    MG = "MGM",
    G = "GRM",
    KG = "KGM",
    LT = "LTR",
    TON = "TNE",
    NET_TON = "NT",
    GROSS_TON = "GT",
    MM = "MMT",
    CM = "CMT",
    M = "MTR",
    KM = "KTM",
    ML = "MLT",
    MM3 = "MMQ",
    CM2 = "CMK",
    CM3 = "CMQ",
    M2 = "MTK",
    M3 = "MTQ",
    KJ = "KJO",
    CL = "CLT",
    KARAT = "CT",
    KWH = "KWH",
    TON_BASINA_TASIMA_KAPASITESI = "CCT",
    BRUT_KALORI = "D30",
    BIN_LT = "D40",
    SAF_ALKOL_LT = "LPA",
    KGM2 = "B32",
    HUCRE_AT = "NCL",
    CIFT = "PR",
    BIN_M3 = "R9",
    SET = "SET",
    BIN_ADET = "T3",
    SCM = "Q37",
    NCM = "Q39",
    MMBTU = "J39",
    M3_GUN = "G52",
    DUZINE = "DZN",
    DMK = "dm2"
}

declare enum HourlySearchInterval {
    NONE = "NONE",
    FIRST_HALF = "FIRST_HALF",
    LAST_HALF = "LAST_HALF"
}

declare enum EInvoiceApiErrorCode {
    /**
     * Bilinmeyen bir hata oluştu.
     */
    UNKNOWN_ERROR = 1,
    /**
     * Oturum zaman aşımına uğradı.
     */
    SESSION_TIMEOUT = 2,
    /**
     * Geçersiz API cevabı.
     */
    INVALID_RESPONSE = 3,
    /**
     * Geçersiz erişim jetonu.
     */
    INVALID_ACCESS_TOKEN = 4,
    /**
     * Basit fatura oluşturulamadı.
     */
    BASIC_INVOICE_NOT_CREATED = 5,
    /**
     * Detaylı fatura bulunamadı.
     */
    INVOICE_NOT_FOUND = 6,
    /**
     * Basit fatura bulunamadı.
     */
    BASIC_INVOICE_NOT_FOUND = 7,
    /**
     * Geçersiz fatura HTML cevabı.
     */
    INVALID_INVOICE_HTML = 8,
    /**
     * Kullanıcı (şirket) bilgisi bulunamadı.
     */
    USER_INFORMATION_NOT_FOUND = 9,
    /**
     * Kullanıcı (şirket) bilgileri güncellenemedı.
     */
    USER_INFORMATION_NOT_UPDATED = 10,
    /**
     * Kayıtlı telefon numarası bulunamadı.
     */
    SAVED_PHONE_NUMBER_NOT_FOUND = 11,
    /**
     * Geçersiz SMS işlem kimliği.
     */
    INVALID_SMS_OPERATION_ID = 12,
    /**
     * Temel faturalar imzalanamadı.
     */
    BASIC_INVOICES_COULD_NOT_SIGNED = 13,
    /**
     * Fatura iptal talebi oluşturulamadı.
     */
    INVOICE_CANCEL_REQUEST_NOT_CREATED = 14,
    /**
     * Basit fatura silinemedi.
     */
    BASIC_INVOICE_NOT_DELETED = 15,
    /**
     * Geçersiz anonim kullanıcı kimliği.
     */
    INVALID_ANONYMOUS_USER_ID = 16,
    /**
     * Şirket bilgileri bulunamadı.
     */
    COMPANY_INFORMATION_NOT_FOUND = 17,
    /**
     * Faturaya ait xml dosyası bulunamadı.
     */
    INVOICE_XML_FILE_NOT_FOUND = 18,
    /**
     * Geçersiz fatura zip dosyası yanıtı.
     */
    INVALID_INVOICE_ZIP_FILE_RESPONSE = 19
}

declare enum EInvoiceCurrencyType {
    AFGHANI = "AFN",
    ALGERIAN_DINAR = "DZD",
    ARGENTINE_PESO = "ARS",
    ARUBAN_GUILDER = "AWG",
    AUSTRALIAN_DOLLAR = "AUD",
    AZERBAIJANIAN_MANAT = "AZM",
    BAHAMIAN_DOLLAR = "BSD",
    BAHRAINI_DINAR = "BHD",
    BAHT = "THB",
    BALBOA = "PAB",
    BARBADOS_DOLLAR = "BBD",
    BELARUSSIAN_RUBLE = "BYR",
    BELIZE_DOLLAR = "BZD",
    BERMUDIAN_DOLLAR = "BMD",
    BOLIVAR = "VEB",
    BOLIVIANO = "BOB",
    BULGARIAN_LEV = "BGN",
    BRAZILIAN_REAL = "BRL",
    BRUNEI_DOLLAR = "BND",
    BURUNDI_FRANC = "BIF",
    CANADIAN_DOLLAR = "CAD",
    CAPE_VERDE_ESCUDO = "CVE",
    CAYMAN_ISLANDS_DOLLAR = "KYD",
    CEDI = "GHC",
    CFA_FRANC_XAF = "XAF",
    CFA_FRANC_XOF = "XOF",
    CFP_FRANC_XPF = "XPF",
    CHILEAN_PESO = "CLP",
    COLOMBIAN_PESO = "COP",
    COMORO_FRANC = "KMF",
    CORDOBA_ORO = "NIO",
    COSTA_RICAN_COLON = "CRC",
    CUBAN_PESO = "CUP",
    CYPRUS_POUND = "CYP",
    CZECH_KORUNA = "CZK",
    DANISH_KRONE = "DKK",
    DALASI = "GMD",
    DENAR = "MKD",
    DIRHAM = "AED",
    DJIBOUTI_FRANC = "DJF",
    DOBRA = "STD",
    DOMINICAN_PESO = "DOP",
    DONG = "VND",
    DRAM = "AMD",
    EAST_CARRIBEAN_DOLLAR = "XCD",
    EGYPTIAN_POUND = "EGP",
    EL_SALVADOR_COLON = "SVC",
    ETHOPIAN_BIRR = "ETB",
    EURO = "EUR",
    FALKLAND_ISLANDS_POUND = "FKP",
    FIJI_DOLLAR = "FJD",
    FORINT = "HUF",
    FRANC_CONGOLAIS = "CDF",
    GIBRALTAR_POUND = "GIP",
    GOLD = "XAU",
    GOURDE = "HTG",
    GUARANI = "PYG",
    GUINEA_FRANC = "GNF",
    GUYANA_DOLLAR = "GYD",
    HKD = "HKD",
    HRYVNIA = "UAH",
    ICELAND_KRONA = "ISK",
    INDIAN_RUPEE = "INR",
    IRAQI_DINAR = "IQD",
    IRANIAN_RIAL = "IRR",
    JAMAICAN_DOLLAR = "JMD",
    JORDANIAN_DINAR = "JOD",
    KENYAN_SHILLING = "KES",
    KINA = "PGK",
    KIP = "LAK",
    KROON = "EEK",
    KUNA = "HRK",
    KUWAITI_DINAR = "KWD",
    KWACHA_MWK = "MWK",
    KWACHA_ZMK = "ZMK",
    KWANZA = "AOA",
    KYAT = "MMK",
    LARI = "GEL",
    LATVIAN_LATS = "LVL",
    LEBANESE_POUND = "LBP",
    LEK = "ALL",
    LEMPIRA = "HNL",
    LEONE = "SLL",
    LEU = "ROL",
    LIBERIAN_DOLLAR = "LRD",
    LIBYAN_DINAR = "LYD",
    LILANGENI = "SZL",
    LITHUANIAN_LITAS = "LTL",
    LOTI = "LSL",
    MALAGASY_FRANC = "MGF",
    MALAYSIAN_RINGGIT = "MYR",
    MALTESE_LIRA = "MTL",
    MANAT = "TMM",
    MAURITIUS_RUPEE = "MUR",
    METICAL = "MZM",
    MEXICAN_PESO = "MXN",
    MOLDOVAN_LEU = "MDL",
    MORROCAN_DIRHAM = "MAD",
    NAIRA = "NGN",
    NAKFA = "ERN",
    NAMIBIA_DOLLAR = "NAD",
    NEPALESE_RUPEE = "NPR",
    NETHERLANDS_ANTILLIAN_GUILDER = "ANG",
    NEW_DINAR = "YUM",
    NEW_ISRAELI_SHEQEL = "ILS",
    NEW_TAIWAN_DOLLAR = "TWD",
    NEW_ZEALAND_DOLLAR = "NZD",
    NORTH_KOREAN_WON = "KPW",
    NORWEGIAN_KRONE = "NOK",
    NGULTRUM = "BTN",
    NUEVO_SOL = "PEN",
    OUGUIYA = "MRO",
    TONGA_PAANGASI = "TOP",
    PAKISTAN_RUPEE = "PKR",
    PALLADIUM = "XPD",
    PATACA = "MOP",
    PESO_URUGUAYO = "UYU",
    PHILIPPINE_PESO = "PHP",
    PLATINUM = "XPT",
    POUND_STERLING = "GBP",
    PULA = "BWP",
    QATARI_RIAL = "QAR",
    QUETZAL = "GTQ",
    RAND = "ZAR",
    RIAL_OMANI = "OMR",
    RIEL = "KHR",
    RUFIYAA = "MVR",
    RUPIAH = "IDR",
    RUSSIAN_RUBLE = "RUB",
    RWANDA_FRANC = "RWF",
    SAUDI_RIYAL = "SAR",
    SDR = "XDR",
    SEYCHELLES_RUPEE = "SCR",
    SILVER = "XAG",
    SINGAPORE_DOLLAR = "SGD",
    SLOVAK_KORUNA = "SKK",
    SOLOMON_ISLANDS_DOLLAR = "SBD",
    SOMALI_SHILLING = "SOS",
    SRI_LANKA_RUPEE = "LKR",
    SOM = "KGS",
    SOMONI = "TJS",
    ST_HELENA_POUND = "SHP",
    SUDANESE_DINAR = "SDD",
    SURINAME_GUILDER = "SRG",
    SWEDISH_KRONA = "SEK",
    SWISS_FRANC = "CHF",
    SYRIAN_POUND = "SYP",
    TAKA = "BDT",
    TALA = "WST",
    TANZANIAN_SHILLING = "TZS",
    TENGE = "KZT",
    TOLAR = "SIT",
    TRINIDAD_AND_TOBAGO_DOLLAR = "TTD",
    TUGRIK = "MNT",
    TUNISIAN_DINAR = "TND",
    TURK_LIRASI = "TRY",
    UGANDA_SHILLING = "UGX",
    US_DOLLAR = "USD",
    UZBEKISTAN_SUM = "UZS",
    VATU = "VUV",
    WON = "KRW",
    YEMENI_RIAL = "YER",
    YEN = "JPY",
    YUAN_RENMINBI = "CNY",
    ZIMBABWE_DOLLAR = "ZWD",
    ZLOTY = "PLN"
}

declare enum InvoiceApprovalStatus {
    APPROVED = "Onayland\u0131",
    UNAPPROVED = "Onaylanmad\u0131",
    DELETED = "Silinmi\u015F"
}

type OtherProps = Record<string, unknown>;
type DateOrDateString = Date | string;
type InvoiceOrUuid = BasicInvoice | string;
interface Credentials {
    /**
     * e-Arşiv kullanıcı adı|kodu.
     */
    readonly username: string | null;
    /**
     * e-Arşiv parolası.
     */
    readonly password: string | null;
}
type EInvoiceConnectOptions = Credentials | {
    /**
     * e-Arşiv'e anonim olarak bağlanmak için kullanıcı adı ve şifre uygular.
     * @see EInvoiceApi.setAnonymousCredentials()
     */
    anonymous: boolean;
};
interface SendSMSCodeResult {
    oid: string;
    phoneNumber: string;
}
interface FilterBasicInvoices {
    /**
     * Başlangıç tarihi.
     * @default new Date()
     */
    startDate?: DateOrDateString;
    /**
     * Bitiş tarihi.
     * @default new Date()
     */
    endDate?: DateOrDateString;
    /**
     * Belgelerin onay durumu.
     * @default undefined
     */
    approvalStatus?: InvoiceApprovalStatus | string;
}
interface FilterBasicInvoicesIssuedToMe extends FilterBasicInvoices {
    /**
     * Faturalar günün hangi aralığında düzenlendi.
     *
     * Not: Varsayılan değer (`HourlySearchInterval.NONE`) dışında bir değer kullanmak istiyorsanız
     * başlangıç ve bitiş tarihlerinin aynı olması gerekmektedir.
     * @default HourlySearchInterval.NONE
     */
    hourlySearchInterval?: HourlySearchInterval;
}
interface InvoiceXsltRendererOptions {
    /**
     * Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     * @default true
     */
    signed?: boolean;
    /**
     * `xsltproc` komut satırı uygulaması seçenekleri.
     * @default undefined
     */
    xsltprocOptions?: XsltprocOptions;
}
interface Invoice {
    /**
     * Fatura kimliği.
     * @alias 'faturaUuid'
     */
    uuid: string;
    /**
     * Faturaya ait belge numarası.
     * @alias 'belgeNumarasi'
     */
    documentNumber: string;
    /**
     * Faturanın düzenlendiği tarih.
     * @alias 'faturaTarihi'
     */
    date: string;
    /**
     * Faturanın düzenlendiği zaman.
     * @alias 'saat'
     */
    time: string;
    /**
     * Faturanın kullanacağı para birimi.
     * @alias 'paraBirimi'
     */
    currency: EInvoiceCurrencyType;
    /**
     * Döviz kuru.
     * @alias 'dovzTLkur'
     */
    currencyRate: number;
    /**
     * Fatura tipi.
     * @alias 'faturaTipi'
     */
    invoiceType: InvoiceType;
    /**
     * @alias 'hangiTip'
     */
    whichType: string | undefined;
    /**
     * Vergi kimlik no veya T.C kimlik no.
     * @alias 'vknTckn'
     */
    taxOrIdentityNumber: string;
    /**
     * Alıcının unvanı.
     * @alias 'aliciUnvan'
     */
    buyerTitle: string;
    /**
     * Alıcının adı.
     * @alias 'aliciAdi'
     */
    buyerFirstName: string;
    /**
     * Alıcının soyadı.
     * @alias 'aliciSoyadi'
     */
    buyerLastName: string;
    /**
     * Alıcının oturduğu binanın adı.
     * @alias 'binaAdi'
     */
    buildingName: string;
    /**
     * Alıcının oturduğu binanın numarası.
     * @alias 'binaNo'
     */
    buildingNumber: string;
    /**
     * Alıcının oturduğu dairenin kapı numarası.
     * @alias 'kapiNo'
     */
    doorNumber: string;
    /**
     * Alıcının yaşadığı kasaba veya köy.
     * @alias 'kasabaKoy'
     */
    town: string;
    /**
     * Alıcının vergi dairesi.
     * @alias 'vergiDairesi'
     */
    taxOffice: string;
    /**
     * Alıcının bulunduğu ülke.
     * @alias 'ulke'
     */
    country: EInvoiceCountry;
    /**
     * Alıcının tam adresi.
     * @alias 'bulvarcaddesokak'
     */
    fullAddress: string;
    /**
     * Alıcının mahalle, semt veya ilçe bilgisi.
     * @alias 'mahalleSemtIlce'
     */
    district: string;
    /**
     * Alıcının yaşadığı şehir.
     * @alias 'sehir'
     */
    city: string;
    /**
     * Posta kodu.
     * @alias 'postaKodu'
     */
    postNumber: string;
    /**
     * Alıcının telefon numarası.
     * @alias 'tel'
     */
    phoneNumber: string;
    /**
     * Alıcının faks numarası.
     * @alias 'fax'
     */
    faxNumber: string;
    /**
     * Alıcının e-posta adresi.
     * @alias 'eposta'
     */
    email: string;
    /**
     * Alıcının website adresi.
     * @alias 'websitesi'
     */
    website: string;
    /**
     * İadeye konu olan faturaların listesi.
     * @alias 'iadeTable',
     */
    refundTable: (Required<RefundInvoice> & OtherProps)[] | undefined;
    /**
     * Özel matrah tutarı.
     * @alias 'ozelMatrahTutari'
     */
    specialBaseAmount: number;
    /**
     * Özel matrah oranı.
     * @alias 'ozelMatrahOrani'
     */
    specialBasePercent: number;
    /**
     * Özel matrah vergi tutarı.
     * @alias 'ozelMatrahVergiTutari'
     */
    specialBaseTaxAmount: number;
    /**
     * Vergi çeşidi.
     * @alias 'vergiCesidi'
     */
    taxType: string | undefined;
    /**
     * Ürün/hizmet listesi.
     * @alias 'malHizmetTable'
     */
    products: (Required<InvoiceProduct> & OtherProps)[];
    /**
     * @alias 'tip',
     * @default İskonto
     */
    type: string;
    /**
     * @alias 'matrah'
     */
    base: number;
    /**
     * Ürünlerin toplam fiyatı.
     * @alias 'malhizmetToplamTutari'
     */
    productsTotalPrice: number;
    /**
     * Ürünlere uygulanan toplam indirim veya arttırım.
     * @alias 'toplamIskonto'
     */
    totalDiscountOrIncrement: number;
    /**
     * Ürünlerin KDV toplamı.
     * @alias 'hesaplanankdv'
     */
    calculatedVAT: number;
    /**
     * Ürünlere uygulanan vergilerin toplamı.
     * @alias 'vergilerToplami'
     */
    totalTaxes: number;
    /**
     * Ürünlerin fiyat, kdv, vergi, indirim ve arttırım değerlerinin toplamı.
     * @alias 'vergilerDahilToplamTutar'
     */
    includedTaxesTotalPrice: number;
    /**
     * Ödenecek toplam tutar.
     * @alias 'odenecekTutar'
     */
    paymentPrice: number;
    /**
     * Faturaya ait not.
     * @alias 'not'
     */
    note: string;
    /**
     * Sipariş numarası.
     * @alias 'siparisNumarasi'
     */
    orderNumber: string | undefined;
    /**
     * Sipariş tarihi.
     * @alias 'siparisTarihi'
     */
    orderDate: string | undefined;
    /**
     * İrsaliye numarası.
     * @alias 'irsaliyeNumarasi'
     */
    waybillNumber: string | undefined;
    /**
     * İrsaliye tarihi.
     * @alias 'irsaliyeTarihi'
     */
    waybillDate: string | undefined;
    /**
     * Fiş numarası.
     * @alias 'fisNo'
     */
    receiptNumber: string | undefined;
    /**
     * Fiş tarihi.
     * @alias 'fisTarihi'
     * @default ''
     */
    receiptDate: string | undefined;
    /**
     * Fiş saati.
     * @alias 'fisSaati'
     */
    receiptTime: string | undefined;
    /**
     * Fiş türü.
     * @alias 'fisTipi'
     */
    receiptType: string | undefined;
    /**
     * Z raporu numarası.
     * @alias 'zRaporNo'
     */
    zReportNumber: string | undefined;
    /**
     * Ödeme kaydedici cihaz numarası.
     * @alias 'okcSeriNo'
     */
    okcSerialNumber: string | undefined;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
interface BasicInvoice {
    /**
     * Fatura kimliği.
     * @alias 'ettn'
     */
    uuid: string;
    /**
     * Belge numarası.
     * @alias 'belgeNumarasi'
     */
    documentNumber: string;
    /**
     * T.C Kimlik veya Vergi Kimlik numarası.
     * @alias 'aliciVknTckn'
     */
    taxOrIdentityNumber: string;
    /**
     * Unvan veya tam adı (Ad Soyad).
     * @alias 'aliciUnvanAdSoyad'
     */
    titleOrFullName: string;
    /**
     * Belgenın düzenlenme tarihi.
     * @alias 'belgeTarihi'
     */
    documentDate: string;
    /**
     * Belgeninin türü.
     * @alias 'belgeTuru'
     */
    documentType: string;
    /**
     * Belgenin onay durumu.
     * @alias 'onayDurumu'
     */
    approvalStatus: InvoiceApprovalStatus | string;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
interface UserInformation {
    /**
     * Unvan (Tüzel Kişiler için).
     * @alias 'unvan'
     */
    title: string;
    /**
     * Ad (Gerçek Kişiler İçin).
     * @alias 'ad'
     */
    firstName: string;
    /**
     * Soyad (Gerçek Kişiler İçin).
     * @alias 'soyad'
     */
    lastName: string;
    /**
     * Vergi kimlik no veya T.C kimlik no.
     * @alias 'vknTckn'
     */
    taxOrIdentityNumber: string;
    /**
     * E-posta adresi.
     * @alias 'ePostaAdresi'
     */
    email: string;
    /**
     * Website adresi.
     * @alias 'webSitesiAdresi'
     */
    website: string;
    /**
     * Sicil numarası.
     * @alias 'sicilNo'
     */
    recordNumber: string;
    /**
     * Mersis numarası.
     * @alias 'mersisNo'
     */
    mersisNumber: string;
    /**
     * Vergi dairesi.
     * @alias 'vergiDairesi'
     */
    taxOffice: string;
    /**
     * Cadde.
     * @alias 'cadde'
     */
    street: string;
    /**
     * Bina/Apartman adı.
     * @alias 'apartmanAdi'
     */
    buildingName: string;
    /**
     * Bina/Apartman numarası.
     * @alias 'apartmanNo'
     */
    buildingNumber: string;
    /**
     * Kapı numarası.
     * @alias 'kapiNo'
     */
    doorNumber: string;
    /**
     * Kasaba/Köy.
     * @alias 'kasaba'
     */
    town: string;
    /**
     * Şehir.
     * @alias 'il'
     */
    city: string;
    /**
     * İlçe.
     * @alias 'ilce'
     */
    district: string;
    /**
     * Posta kodu.
     * @alias 'postaKodu'
     */
    postNumber: string;
    /**
     * Ülke.
     * @alias 'ulke'
     */
    country: EInvoiceCountry;
    /**
     * Telefon numarası.
     * @alias 'telNo'
     */
    phoneNumber: string;
    /**
     * Faks numarası.
     * @alias 'faksNo'
     */
    faxNumber: string;
    /**
     * İş merkezi.
     * @alias 'isMerkezi'
     */
    businessCenter: string;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
interface CompanyInformation {
    /**
     * Unvan (Tüzel Kişiler için).
     * @alias 'unvan'
     */
    title: string;
    /**
     * Ad (Gerçek Kişiler İçin)
     * @alias 'adi'
     */
    firstName: string;
    /**
     * Soyad (Gerçek Kişiler İçin).
     * @alias 'soyadi'
     */
    lastName: string;
    /**
     * Vergi dairesi
     * @alias 'taxOffice'
     */
    taxOffice: string;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
interface RefundInvoice {
    /**
     * İadeye konu olan faturanın numarası.
     * @alias 'faturaNo'
     */
    invoiceNumber: string;
    /**
     * İadeye konu olan faturanın düzenlendiği tarih.
     * @alias 'duzenlenmeTarihi'
     * @default DD/MM/YYYY
     */
    date?: DateOrDateString;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
interface InvoiceProduct {
    /**
     * Ürün/Hizmet adı.
     * @alias 'malHizmet'
     */
    name: string;
    /**
     * Ürün/Hizmet adedi.
     * @alias 'miktar'
     * @default 1
     */
    quantity?: number;
    /**
     * Birim türü.
     * @alias 'birim'
     * @default UnitType.ADET
     */
    unitType?: EInvoiceUnitType;
    /**
     * Birim fiyat.
     * @alias 'birimFiyat'
     */
    unitPrice: number;
    /**
     * KDV hariç toplam fiyat. (unitPrice * quantity)
     * @alias 'fiyat'
     */
    price: number;
    /**
     * @alias 'iskontoArttm'
     * @default İskonto
     */
    discountOrIncrement?: 'İskonto' | 'Arttırım' | string;
    /**
     * İndirim veya arttırım oranı.
     * @alias 'iskontoOrani'
     * @default 0
     */
    discountOrIncrementRate?: number;
    /**
     * İndirim veya arttırım tutarı.
     * @alias 'iskontoTutari'
     * @default 0
     */
    discountOrIncrementAmount?: number;
    /**
     * İndirimin veya arttırımın uygulanma nedeni.
     * @alias 'iskontoNedeni'
     * @default ''
     */
    discountOrIncrementReason?: string;
    /**
     * Toplam tutar. Ürün fiyatı (`InvoiceProduct.price`) ve vergilerin toplamı.
     * @alias 'malHizmetTutari'
     */
    totalAmount: number;
    /**
     * KDV oranı.
     * @alias 'kdvOrani'
     * @default 0
     */
    vatRate?: number;
    /**
     * Vergi oranı.
     * @alias 'vergiOrani'
     * @default 0
     */
    taxRate?: number;
    /**
     * KDV tutarı. (Örn. price * (1 + vatRate / 100))
     * @alias 'kdvTutari'
     * @default 0
     */
    vatAmount?: number;
    /**
     * @alias 'vergininKdvTutari'
     * @default 0
     */
    vatAmountOfTax?: number;
    /**
     * Özel matrah tutarı
     * @alias 'ozelMatrahTutari'
     * @default 0
     */
    specialBaseAmount?: number;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
interface CreateDraftInvoicePayload {
    /**
     * Fatura kimliği.
     * @alias 'faturaUuid'
     */
    uuid?: string;
    /**
     * Faturaya ait belge numarası.
     * @alias 'belgeNumarasi'
     * @default ''
     */
    documentNumber?: string;
    /**
     * Faturanın düzenlendiği tarih.
     * @alias 'faturaTarihi'
     * @default DD/MM/YYYY
     */
    date?: DateOrDateString;
    /**
     * Faturanın düzenlendiği saat.
     * @alias 'saat'
     * @default HH:MM:SS
     */
    time?: DateOrDateString;
    /**
     * Faturanın kullanacağı para birimi.
     * @alias 'paraBirimi'
     * @default CurrencyType.TURK_LIRASI
     */
    currency?: EInvoiceCurrencyType;
    /**
     * Döviz kuru. `curreny` alanı `EInvoiceCurrencyType.TURK_LIRASI` olarak belirtildiğinde kullanılamaz.
     * @alias 'dovzTLkur'
     * @default 0
     */
    currencyRate?: number;
    /**
     * Fatura tipi.
     * @alias 'faturaTipi'
     * @default InvoiceType.SATIS
     */
    invoiceType?: InvoiceType;
    /**
     * @alias 'hangiTip'
     * @default 5000/30000
     */
    whichType?: string;
    /**
     * Vergi kimlik no veya T.C kimlik no.
     * @alias 'vknTckn'
     * @default 11111111111
     */
    taxOrIdentityNumber?: string;
    /**
     * Alıcının unvanı.
     * @alias 'aliciUnvan'
     * @default ''
     */
    buyerTitle?: string;
    /**
     * Alıcının adı.
     * @alias 'aliciAdi'
     * @default ''
     */
    buyerFirstName?: string;
    /**
     * Alıcının soyadı.
     * @alias 'aliciSoyadi'
     * @default ''
     */
    buyerLastName?: string;
    /**
     * Alıcının oturduğu binanın adı.
     * @alias 'binaAdi'
     * @default ''
     */
    buildingName?: string;
    /**
     * Alıcının oturduğu binanın numarası.
     * @alias 'binaNo'
     * @default ''
     */
    buildingNumber?: string;
    /**
     * Alıcının oturduğu dairenin kapı numarası.
     * @alias 'kapiNo'
     * @default ''
     */
    doorNumber?: string;
    /**
     * Alıcının yaşadığı kasaba veya köy.
     * @alias 'kasabaKoy'
     * @default ''
     */
    town?: string;
    /**
     * Alıcının vergi dairesi.
     * @alias 'vergiDairesi'
     * @default ''
     */
    taxOffice?: string;
    /**
     * Alıcının bulunduğu ülke.
     * @alias 'ulke'
     * @default Country.TURKIYE
     */
    country?: EInvoiceCountry;
    /**
     * Alıcının tam adresi.
     * @alias 'bulvarcaddesokak'
     * @default ''
     */
    fullAddress?: string;
    /**
     * Alıcının mahalle, semt veya ilçe bilgisi.
     * @alias 'mahalleSemtIlce'
     * @default ''
     */
    district?: string;
    /**
     * Alıcının yaşadığı şehir.
     * @alias 'sehir'
     * @default ''
     */
    city?: string;
    /**
     * Posta kodu.
     * @alias 'postaKodu'
     * @default ''
     */
    postNumber?: string;
    /**
     * Alıcının telefon numarası.
     * @alias 'tel'
     * @default ''
     */
    phoneNumber?: string;
    /**
     * Alıcının faks numarası.
     * @alias 'fax'
     * @default ''
     */
    faxNumber?: string;
    /**
     * Alıcının e-posta adresi.
     * @alias 'eposta'
     * @default ''
     */
    email?: string;
    /**
     * Alıcının website adresi.
     * @alias 'websitesi'
     * @default ''
     */
    website?: string;
    /**
     * "invoiceType" alanı "IADE" olarak ayarlandığında, iadeye konu olan faturaların listesi.
     * @alias 'iadeTable',
     * @default []
     */
    refundTable?: RefundInvoice[];
    /**
     * Özel matrah tutarı.
     * @alias 'ozelMatrahTutari'
     * @default 0
     */
    specialBaseAmount?: number;
    /**
     * Özel matrah oranı.
     * @alias 'ozelMatrahOrani'
     * @default 0
     */
    specialBasePercent?: number;
    /**
     * Özel matrah vergi tutarı.
     * @alias 'ozelMatrahVergiTutari'
     * @default 0
     */
    specialBaseTaxAmount?: number;
    /**
     * Vergi çeşidi.
     * @alias 'vergiCesidi'
     * @default ' '
     */
    taxType?: string;
    /**
     * Fatura edilecek ürün/hizmet listesi.
     * @alias 'malHizmetTable'
     */
    products: InvoiceProduct[];
    /**
     * @alias 'tip',
     * @default İskonto
     */
    type?: string;
    /**
     * Vergiye tabi tutar/değer. (Örn. Hesaplanan KDV / (KDV oranı / 100))
     * @alias 'matrah'
     */
    base: number;
    /**
     * Ürünlerin toplam fiyatı.
     * @alias 'malhizmetToplamTutari'
     */
    productsTotalPrice: number;
    /**
     * Ürünlere uygulanan toplam indirim veya arttırım.
     * @alias 'toplamIskonto'
     * @default 0
     */
    totalDiscountOrIncrement?: number;
    /**
     * Ürünlerin KDV toplamı.
     * @alias 'hesaplanankdv'
     * @default 0
     */
    calculatedVAT?: number;
    /**
     * Ürünlere uygulanan vergilerin toplamı.
     * @alias 'vergilerToplami'
     * @default 0
     */
    totalTaxes?: number;
    /**
     * Ürünlerin fiyat, kdv, vergi, indirim ve arttırım değerlerinin toplamı.
     * @alias 'vergilerDahilToplamTutar'
     */
    includedTaxesTotalPrice: number;
    /**
     * Ödenecek toplam tutar.
     * @alias 'odenecekTutar'
     */
    paymentPrice: number;
    /**
     * Faturaya ait not.
     * @alias 'not'
     * @default ''
     */
    note?: string;
    /**
     * Sipariş numarası.
     * @alias 'siparisNumarasi'
     * @default ''
     */
    orderNumber?: string;
    /**
     * Sipariş tarihi.
     * @alias 'siparisTarihi'
     * @default ''
     */
    orderDate?: DateOrDateString;
    /**
     * İrsaliye numarası.
     * @alias 'irsaliyeNumarasi'
     * @default ''
     */
    waybillNumber?: string;
    /**
     * İrsaliye tarihi.
     * @alias 'irsaliyeTarihi'
     * @default ''
     */
    waybillDate?: DateOrDateString;
    /**
     * Fiş numarası.
     * @alias 'fisNo'
     * @default ''
     */
    receiptNumber?: string;
    /**
     * Fiş tarihi.
     * @alias 'fisTarihi'
     * @default ''
     */
    receiptDate?: DateOrDateString;
    /**
     * Fiş saati.
     * @alias 'fisSaati'
     * @default ''
     */
    receiptTime?: string;
    /**
     * Fiş türü.
     * @alias 'fisTipi'
     * @default ''
     */
    receiptType?: string;
    /**
     * Z raporu numarası.
     * @alias 'zRaporNo'
     * @default ''
     */
    zReportNumber?: string;
    /**
     * Ödeme kaydedici cihaz numarası.
     * @alias 'okcSeriNo'
     * @default ''
     */
    okcSerialNumber?: string;
    /**
     * Diğer alanlar.
     */
    [p: string]: unknown;
}
type UpdateDraftInvoicePayload = Partial<Invoice> & OtherProps;
type UpdateUserInformationPayload = Partial<UserInformation> & OtherProps;

declare function mappingBasicInvoiceKeys(value: unknown, mappingWithTurkishKeys?: boolean): Record<string, unknown>;

declare function mappingBasicInvoiceIssuedToMeKeys(value: unknown, mappingWithTurkishKeys?: boolean): Record<string, unknown>;

interface XsltprocOptions {
    /**
     * XSLT şablonunun isim parametresine değer değerini aktarmakta kullanılır En fazla 32
     çift isim/değer çifti aktarabilirsiniz. Şayet verilen değer bir düğüm tanımlayıcısı
     değil de bir dizge ise, **stringParams** seçeneğini kullanmak daha uygundur.
     @default {}
     */
    params?: Record<string, string | number>;
    /**
     * Değerin bir düğüm tanımlayıcısı değil de bir dizge olduğu durumlarda, XSLT
     şablonunun isim parametresine değer değerini aktarmakta kullanılır. Dizge mutlaka
     UTF-8 kodlanmış olmalıdır.
     * @default {}
     */
    stringParams?: Record<string, string | number>;
    /**
     * `xsltproc` komut satırı uygulamasının çalıştırılabilir dosya yolu.
     * @default /usr/bin/xsltproc
     */
    xsltprocExecutablePath?: string;
}

interface EInvoiceApiResponseError {
    error: '1';
    messages: {
        text: string;
        type: string;
    }[];
}
declare function isEInvoiceApiResponseError(value: unknown): value is EInvoiceApiResponseError;

declare class XsltRenderer {
    private readonly xsltFilePath;
    private readonly getXmlBuffer;
    private readonly xsltprocOptions?;
    private xmlBuffer;
    constructor(xsltFilePath: string, getXmlBuffer: () => Promise<Buffer>, xsltprocOptions?: XsltprocOptions | undefined);
    /**
     * XSLT şablonunun pdf çıktısını verir.
     */
    toPdf(options?: PdfOptions): Promise<Buffer>;
    /**
     * XSLT şablonunun html çıktısını verir.
     */
    toHtml(): Promise<Buffer>;
    /**
     * İlgili faturaya ait xml çıktısını verir.
     */
    toXml(): Promise<Buffer>;
    /**
     * XSLT şablonunun içeriğini verir.
     */
    getXsltContent(): Promise<Buffer>;
    /**
     * XSLT şablonunun base64 ile kodlanmış içeriğini verir.
     */
    xsltToBase64Encoded(): Promise<string>;
    private render;
}

declare class EInvoiceApi {
    private testMode;
    private token;
    private username;
    private password;
    static BASE_URL: string;
    static TEST_BASE_URL: string;
    static DISPATCH_PATH: string;
    static TOKEN_PATH: string;
    static REFERRER_PATH: string;
    static DEFAULT_HEADERS: Record<string, string>;
    constructor(credentials?: Credentials);
    /**
     * Yeni bir e-Arşiv API örneği oluşturur.
     */
    static create(credentials?: Credentials): EInvoiceApi;
    /**
     * Var olan erişim jetonunu döndürür.
     */
    getToken(): string | null;
    /**
     * Var olan erişim jetonunu değiştirir.
     * @param value Erişim jetonu değeri.
     */
    setToken(value: string | null): EInvoiceApi;
    /**
     * Test modunun aktif olup olmadığı
     */
    get isTestMode(): boolean;
    /**
     * Test modunu aktif/deaktif eder.
     * @param value
     */
    setTestMode(value: boolean): EInvoiceApi;
    /**
     * Kullanıcı adı veya şifre bilgisini atamak için kullanılır.
     * @param value Kullanıcı adı veya şifre bilgisi.
     */
    setCredentials(value: Partial<Credentials>): EInvoiceApi;
    /**
     * Mevcut olan kullanıcı adı ve şifre bilgisini getirir.
     */
    getCredentials(): Credentials;
    /**
     * e-Arşiv oturumunu başlatır.
     * @param options Bağlantı seçenekleri.
     */
    connect(options: EInvoiceConnectOptions): Promise<void>;
    /**
     * e-Arşiv oturumunu sonlandırır.
     */
    logout(): Promise<void>;
    /**
     * e-Arşiv üxerinde kullanılacak erişim jetonunu alır.
     */
    getAccessToken(): Promise<string>;
    /**
     * Erişim jetonunu alır ve `this.token` değişkenine atar.
     */
    initAccessToken(): Promise<void>;
    /**
     * e-Arşiv üzerinde bulunan bir faturayı UUID'ine göre getirir.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     */
    getInvoice(invoiceOrUuid: InvoiceOrUuid): Promise<Invoice>;
    /**
     * Düzenlenen faturaları getirir.
     * @param filter Faturaları filtrelemek için.
     */
    getBasicInvoices(filter?: FilterBasicInvoices): Promise<BasicInvoice[]>;
    /**
     * Adınıza düzenlenen faturaları getirir.
     * @param filter Faturaları filtrelemek için.
     */
    getBasicInvoicesIssuedToMe(filter?: FilterBasicInvoicesIssuedToMe): Promise<BasicInvoice[]>;
    /**
     * Faturayı UUID değerine göre bulur.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param filter Faturaları filtreleme seçenekleri.
     */
    findBasicInvoice(invoiceOrUuid: InvoiceOrUuid, filter?: FilterBasicInvoices): Promise<BasicInvoice>;
    /**
     * Faturanın html çıktısını getirir.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     * @param injectPrintScript HTML çıktısına `window.print()` komutunu ekler.
     */
    getInvoiceHtml(invoiceOrUuid: InvoiceOrUuid, signed?: boolean, injectPrintScript?: boolean): Promise<string>;
    /**
     * Faturayı PDF'e dönüştürür.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     * @param options PDF seçenekleri.
     */
    getInvoicePdf(invoiceOrUuid: InvoiceOrUuid, signed?: boolean, options?: PdfOptions): Promise<Buffer>;
    /**
     * Faturayı zip formatına dönüştürür.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     */
    getInvoiceZip(invoiceOrUuid: InvoiceOrUuid, signed?: boolean): Promise<Buffer>;
    /**
     * Faturayı xml formatına dönüştürür.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     */
    getInvoiceXml(invoiceOrUuid: InvoiceOrUuid, signed?: boolean): Promise<Buffer>;
    /**
     * Faturanın indirilebilir bağlantısını verir.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param signed Faturanın onay durumunu belirler. `true` Onaylandı `false` Onaylanmadı.
     */
    getInvoiceDownloadUrl(invoiceOrUuid: InvoiceOrUuid, signed?: boolean): string;
    /**
     * Belirli bir faturayı XSLT şablonu ile derlemenize olanak tanır.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param xsltFilePath XSLT şablonun yolu.
     * @param options XSLT şablonu derlemesi ve fatura ile ilgili seçenekler.
     */
    invoiceXsltRenderer(invoiceOrUuid: InvoiceOrUuid, xsltFilePath: string, options?: InvoiceXsltRendererOptions): XsltRenderer;
    /**
     * e-Arşiv kullanıcı (şirket) bilgilerini getirir.
     */
    getUserInformation(): Promise<UserInformation>;
    /**
     * e-Arşiv kullanıcı (şirket) bilgilerini günceller.
     * @param payload Güncellemeye ait yük.
     */
    updateUserInformation(payload: UpdateUserInformationPayload): Promise<UserInformation>;
    /**
     * Vergi Kimlik No veya T.C Kimlik No'ya göre tüzel veya gerçek kişilerin şirket bilgisini alır.
     * @param taxOrIdentityNumber Vergi Kimlik No veya T.C Kimlik No
     */
    getCompanyInformation(taxOrIdentityNumber: string): Promise<CompanyInformation>;
    /**
     * e-Arşiv üzerinde kayıtlı olan telefon numarasını getirir.
     */
    getSavedPhoneNumber(): Promise<string>;
    /**
     * e-Arşiv üzerinde taslak fatura oluşturur.
     * @param payload Faturaya ait yük.
     */
    createDraftInvoice(payload: CreateDraftInvoicePayload): Promise<boolean>;
    /**
     * e-Arşiv üzerinde taslak olarak bulunan bir faturayı günceller.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     * @param payload Güncelleme yükü.
     */
    updateDraftInvoice(invoiceOrUuid: InvoiceOrUuid, payload: UpdateDraftInvoicePayload): Promise<Invoice>;
    /**
     * e-Arşiv üzerinde taslak olarak bulunan bir faturayı siler.
     * @param invoice Fatura içeriği.
     * @param reason Silme nedeni.
     */
    deleteDraftInvoice(invoice: BasicInvoice, reason: string): Promise<boolean>;
    /**
     * e-Arşiv fatura iptal talebi oluşturur.
     * @param invoice Fatura içeriği.
     * @param reason İptal talebi nedeni.
     */
    createCancelRequestForInvoice(invoice: BasicInvoice, reason: string): Promise<boolean>;
    /**
     * @see EInvoiceApi.getSavedPhoneNumber()
  
     * Fatura imzalamak için SMS ile doğrulama kodu gönderilir.
     * Ayrıca, doğrulamaya ait işlem kimliği ve kodun gönderildiği telefon numarası geri döner.
     */
    sendSMSCode(): Promise<SendSMSCodeResult>;
    /**
     * e-Arşiv üzerinde bulunan faturaları imzalar.
     * @see EInvoiceApi.sendSMSCode()
     * @param code e-Arşiv üzerinde kayıtlı olan telefon numarasına gelen doğrulama kodu.
     * @param oid `EInvoiceApi.sendSMSCode()` ile alınan işlem kimliği.
     * @param invoices İmzalanacak fatura(lar).
     */
    signInvoices(code: string, oid: string, invoices: BasicInvoice | BasicInvoice[]): Promise<boolean>;
    /**
     * e-Arşiv'e anonim olarak bağlanmak için kullanıcı adı ve şifre getirir.
     */
    getAnonymousCredentials(): Promise<Credentials>;
    /**
     * e-Arşiv'e anonim olarak bağlanmak için kullanıcı adı ve şifre uygular.
     */
    setAnonymousCredentials(): Promise<void>;
    /**
     * Faturanın UUID'ini alır.
     * @param invoiceOrUuid Fatura veya faturanın UUID'i.
     */
    getInvoiceUuid(invoiceOrUuid: InvoiceOrUuid): string;
    /**
     * Faturaları onay durumuna göre filtreler.
     * @param invoices Filtrelenecek faturalar.
     * @param status Onay durumu.
     */
    filterBasicInvoicesByApprovalStatus(invoices: BasicInvoice[], status?: InvoiceApprovalStatus | string): BasicInvoice[];
    private sendRequest;
    private getBaseURL;
    private checkToken;
    private checkCredentials;
}

declare abstract class EInvoiceError extends Error {
    abstract get name(): string;
}

interface EInvoiceApiErrorResponse<T = unknown> {
    data: T;
    errorCode: EInvoiceApiErrorCode;
}
declare class EInvoiceApiError<T = unknown> extends EInvoiceError {
    readonly response: EInvoiceApiErrorResponse<T>;
    constructor(message: string, response: EInvoiceApiErrorResponse<T>);
    get name(): string;
    get errorCode(): EInvoiceApiErrorCode;
}

declare class EInvoiceTypeError extends EInvoiceError {
    get name(): string;
}

declare class EInvoiceMissingTokenError extends EInvoiceError {
    get name(): string;
}

declare class EInvoiceMissingCredentialsError extends EInvoiceError {
    readonly credentials: Credentials;
    constructor(message: string, credentials: Credentials);
    get name(): string;
}

declare const EInvoice: EInvoiceApi;

export { type BasicInvoice, type CompanyInformation, type CreateDraftInvoicePayload, type Credentials, type DateOrDateString, EInvoice, EInvoiceApi, EInvoiceApiError, EInvoiceApiErrorCode, type EInvoiceApiErrorResponse, type EInvoiceApiResponseError, type EInvoiceConnectOptions, EInvoiceCountry, EInvoiceCurrencyType, EInvoiceError, EInvoiceMissingCredentialsError, EInvoiceMissingTokenError, EInvoiceTypeError, EInvoiceUnitType, type FilterBasicInvoices, type FilterBasicInvoicesIssuedToMe, HourlySearchInterval, type Invoice, InvoiceApprovalStatus, type InvoiceOrUuid, type InvoiceProduct, InvoiceType, type InvoiceXsltRendererOptions, type RefundInvoice, type SendSMSCodeResult, type UpdateDraftInvoicePayload, type UpdateUserInformationPayload, type UserInformation, XsltRenderer, EInvoice as default, getDateFormat, isEInvoiceApiResponseError, mappingBasicInvoiceIssuedToMeKeys, mappingBasicInvoiceKeys, paymentPriceToText };
