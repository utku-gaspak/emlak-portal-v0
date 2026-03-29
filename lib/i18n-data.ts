import tr from "@/locales/tr.json";
import en from "@/locales/en.json";

export type Locale = "tr" | "en";

export const LOCALE_COOKIE_NAME = "locale";
export const DEFAULT_LOCALE: Locale = "tr";

export type Dictionary = typeof tr;

function decodeMojibake(value: string): string {
  const looksBroken =
    value.includes("\u00c3") ||
    value.includes("\u00c4") ||
    value.includes("\u00c5") ||
    value.includes("\u00c2") ||
    value.includes("\u00e2");

  if (!looksBroken) {
    return value;
  }

  try {
    const bytes = new Uint8Array(Array.from(value, (character) => character.charCodeAt(0)));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

function sanitizeValue<T>(value: T): T {
  if (typeof value === "string") {
    return decodeMojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      sanitizeValue(nestedValue)
    ]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = result[key];

    if (
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue) &&
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = deepMerge(baseValue as Record<string, unknown>, overrideValue as Record<string, unknown>);
      continue;
    }

    result[key] = overrideValue as unknown;
  }

  return result as T;
}

const trOverrides = {
  common: {
    close: "\u0130ptal",
    next: "\u0130leri",
    previous: "Geri",
    viewDetails: "Detaylar\u0131 G\u00f6r",
    search: "Ara",
    clear: "Temizle",
    loading: "Y\u00fckleniyor...",
    searchOverlay: "Arama Katman\u0131",
    featured: "\u00d6ne \u00c7\u0131kan",
    squareMetersUnit: "m\u00b2",
    turkish: "TR",
    english: "EN"
  },
  meta: {
    lang: "tr",
    title: "Gaspak Emlak",
    description: "G\u00fcvenilir ve modern emlak ilan platformu."
  },
  siteHeader: {
    brandName: "Gaspak Emlak",
    adminPortal: "Y\u00f6netim Paneli",
    dashboard: "Panele Git",
    languageLabel: "Dil",
    navHome: "Ana Sayfa",
    navListings: "\u0130lanlar",
    navAbout: "Hakk\u0131m\u0131zda",
    navContact: "\u0130leti\u015fim",
    listProperty: "\u0130lan Ver"
  },
  errors: {
    authUnauthorized: "Yetkisiz eri\u015fim.",
    passwordRequired: "\u015eifre gerekli.",
    passwordInvalid: "Ge\u00e7ersiz y\u00f6netici \u015fifresi.",
    propertyTypeRequired: "\u0130lan tipi gerekli.",
    statusRequired: "Durum gerekli.",
    statusInvalid: "Durum ge\u00e7ersiz.",
    categoryRequired: "Kategori se\u00e7imi gerekli.",
    categoryInvalid: "Kategori ge\u00e7ersiz.",
    titleRequired: "Ba\u015fl\u0131k gerekli.",
    listingNoRequired: "Ta\u015f\u0131nmaz ilan numaras\u0131 gerekli.",
    priceInvalid: "Fiyat pozitif bir say\u0131 olmal\u0131.",
    locationRequired: "Konum gerekli.",
    areaInvalid: "Alan pozitif bir say\u0131 olmal\u0131.",
    descriptionRequired: "A\u00e7\u0131klama gerekli.",
    photosRequired: "L\u00fctfen en az bir foto\u011fraf y\u00fckleyin.",
    roomCountRequired: "Oda say\u0131s\u0131 gerekli.",
    floorNumberRequired: "Kat numaras\u0131 gerekli.",
    heatingTypeRequired: "Is\u0131tma tipi gerekli.",
    zoningStatusRequired: "\u0130mar durumu gerekli.",
    islandNumberRequired: "Ada numaras\u0131 gerekli.",
    parcelNumberRequired: "Parsel numaras\u0131 gerekli.",
    currencyInvalid: "Para birimi ge\u00e7ersiz.",
    listingNotFound: "\u0130lan bulunamad\u0131.",
    deleteFailed: "\u0130lan silinemedi.",
    invalidRequestBody: "Ge\u00e7ersiz istek g\u00f6vdesi.",
    invalidImageSelection: "Ge\u00e7ersiz g\u00f6rsel se\u00e7imi.",
    photoFolderNotFound: "Foto\u011fraf klas\u00f6r\u00fc bulunamad\u0131.",
    photoNotFound: "Foto\u011fraf bulunamad\u0131.",
    adminLoginRouteDeprecated: "Y\u00f6netici giri\u015fi i\u00e7in NextAuth signIn() kullan\u0131n.",
    latitudeInvalid: "Enlem -90 ile 90 aras\u0131nda olmal\u0131d\u0131r.",
    longitudeInvalid: "Boylam -180 ile 180 aras\u0131nda olmal\u0131d\u0131r."
  },
  home: {
    heroEyebrow: "Premium Emlak Se\u00e7kisi",
    heroTitle: "Hayalinizdeki Gayrimenkul\u00fc Ke\u015ffedin.",
    heroDescription: "Do\u011frulanm\u0131\u015f ilanlar\u0131m\u0131z aras\u0131ndan size en uygun evi bulun.",
    stats: {
      curated: {
        value: "Se\u00e7ilmi\u015f ilanlar",
        label: "\u015eimdi mevcut"
      },
      fast: {
        value: "H\u0131zl\u0131",
        label: "Ara ve kar\u015f\u0131la\u015ft\u0131r"
      },
      rpaReady: {
        value: "G\u00fcvenli",
        label: "\u015effaf i\u015flem s\u00fcreci"
      }
    },
    searchTitle: "Do\u011fru gayrimenkul\u00fc h\u0131zl\u0131ca bulun",
    searchDescription: "Ba\u015fl\u0131\u011fa, konuma, oda say\u0131s\u0131na veya a\u00e7\u0131klamaya g\u00f6re arama yap\u0131n.",
    searchPlaceholder: "\u0130stanbul'da modern daire",
    searchButton: "\u0130lan Ara",
    clearButton: "Temizle",
    adminAddButton: "Admin: \u0130lan Ekle",
    showingProperties: "G\u00f6sterilen ilanlar",
    showingResultsFor: "\u015eu sonu\u00e7lar g\u00f6steriliyor",
    noResultsTitle: "E\u015fle\u015fen ilan bulunamad\u0131.",
    noResultsDescription: "Daha geni\u015f arama yap\u0131n ya da her \u015feyi g\u00f6rmek i\u00e7in sorguyu temizleyin.",
    aboutEyebrow: "Kurumsal Yakla\u015f\u0131m",
    aboutTitle: "Gayrimenkul deneyimini daha sade, daha \u015f\u0131k ve daha g\u00fcvenilir hale getiriyoruz.",
    aboutDescription:
      "Se\u00e7ilmi\u015f portf\u00f6yler, d\u00fczenli sunum ve otomasyona uygun altyap\u0131s\u0131yla al\u0131c\u0131 ile sat\u0131c\u0131y\u0131 ayn\u0131 \u00e7at\u0131 alt\u0131nda bulu\u015fturur."
  },
  filters: {
    title: "Filtreler",
    anyOption: "Hepsi",
    searchLabel: "Ara",
    searchPlaceholder: "Ba\u015fl\u0131\u011fa veya konuma g\u00f6re aray\u0131n",
    statusLabel: "Durum",
    statusAll: "T\u00fcm\u00fc",
    statusForSale: "Sat\u0131l\u0131k",
    statusForRent: "Kiral\u0131k",
    currencyLabel: "Para Birimi",
    currencyTL: "\u20ba TL",
    currencyUSD: "$ USD",
    currencyEUR: "\u20ac EUR",
    parentCategoryLabel: "Ana Kategori",
    parentCategoryPlaceholder: "Ana kategori se\u00e7in",
    subcategoryLabel: "Alt Kategori",
    subcategoryPlaceholder: "Alt kategori se\u00e7in",
    sortByLabel: "S\u0131rala",
    sortNewestFirst: "En Yeniler",
    sortPriceLowToHigh: "Fiyat: D\u00fc\u015f\u00fckten Y\u00fckse\u011fe",
    sortPriceHighToLow: "Fiyat: Y\u00fcksekten D\u00fc\u015fe",
    sortOldestFirst: "En Eskiler",
    sortReset: "S\u0131ralamay\u0131 s\u0131f\u0131rla",
    resetAll: "Hepsini s\u0131f\u0131rla",
    minPriceLabel: "Minimum Fiyat",
    maxPriceLabel: "Maksimum Fiyat",
    roomCountLabel: "Oda Say\u0131s\u0131",
    heatingTypeLabel: "Is\u0131tma Tipi",
    zoningStatusLabel: "\u0130mar Durumu",
    zoningTypeLabel: "\u0130mar Durumu",
    applyButton: "Filtreleri Uygula",
    submitButton: "\u0130lan Ara"
  },
  adminPage: {
    eyebrow: "Y\u00f6netim Paneli",
    title: "Yeni \u0130lan Ekle",
    description: "Bu rota \u015fifre korumal\u0131d\u0131r ve deterministik ajan otomasyonu i\u00e7in haz\u0131rlanm\u0131\u015ft\u0131r.",
    loginHint: "\u0130lan olu\u015fturmay\u0131 a\u00e7mak i\u00e7in y\u00f6netici \u015fifresini girin.",
    authenticated: "Y\u00f6netici olarak giri\u015f yap\u0131ld\u0131.",
    logoutButton: "\u00c7\u0131k\u0131\u015f Yap",
    backHome: "\u0130lanlara geri d\u00f6n",
    backToListings: "Listeye geri d\u00f6n",
    backToSite: "Siteye d\u00f6n"
  },
  adminEditPage: {
    eyebrow: "\u0130lanlar",
    title: "\u0130lan\u0131 D\u00fczenle",
    description: "Ba\u015fl\u0131\u011f\u0131, fiyat\u0131, kategoriyi veya foto\u011fraflar\u0131 yeni kay\u0131t olu\u015fturmadan g\u00fcncelleyin."
  },
  adminLogin: {
    eyebrow: "Y\u00f6netim Giri\u015fi",
    title: "Admin Giri\u015fi",
    description: "Pano eri\u015fimi i\u00e7in bilgilerinizi girin.",
    usernameLabel: "Admin Kullan\u0131c\u0131 Ad\u0131",
    usernamePlaceholder: "Kullan\u0131c\u0131 ad\u0131 girin",
    passwordLabel: "Admin \u015eifresi",
    passwordPlaceholder: "\u015eifre girin",
    button: "Admini A\u00e7",
    checking: "Kontrol ediliyor...",
    loginFailed: "Giri\u015f Ba\u015far\u0131s\u0131z"
  },
  admin: {
    form: {
      statusLabel: "Durum",
      statusAll: "T\u00fcm\u00fc",
      statusForSale: "Sat\u0131l\u0131k",
      statusForRent: "Kiral\u0131k",
      parentCategoryLabel: "Ana Kategori",
      parentCategoryPlaceholder: "Ana kategori se\u00e7in",
      subCategoryLabel: "Alt Kategori",
      subCategoryPlaceholder: "Alt kategori se\u00e7in",
      featured: "\u00d6ne \u00c7\u0131kan \u0130lan olarak i\u015faretle",
      featuredDescription: "\u00d6ne \u00e7\u0131kan ilanlar varsay\u0131lan olarak ana sayfan\u0131n en \u00fcst\u00fcnde g\u00f6r\u00fcn\u00fcr.",
      title: "Ba\u015fl\u0131k",
      titlePlaceholder: "\u00d6rn. Bo\u011faz manzaral\u0131 daire",
      listingNo: "Ta\u015f\u0131nmaz \u0130lan No",
      listingNoPlaceholder: "\u00d6rn. 100245",
      price: "Fiyat",
      pricePlaceholder: "0",
      currency: "Para Birimi",
      currencyTL: "\u20ba TL",
      currencyUSD: "$ USD",
      currencyEUR: "\u20ac EUR",
      location: "Konum",
      locationPlaceholder: "\u0130stanbul",
      areaSqm: "Alan (m\u00b2)",
      areaPlaceholder: "120",
      houseSectionTitle: "Ev \u00d6zellikleri",
      houseSectionDescription: "Yaln\u0131zca eve \u00f6zel alanlar\u0131 doldurun.",
      roomCount: "Oda Say\u0131s\u0131",
      roomCountPlaceholder: "3+1",
      floorNumber: "Kat Numaras\u0131",
      floorPlaceholder: "7",
      heatingType: "Is\u0131tma",
      heatingPlaceholder: "Merkezi Is\u0131tma",
      landSectionTitle: "Arsa \u00d6zellikleri",
      landSectionDescription: "Yaln\u0131zca arsa bilgilerini doldurun.",
      zoningStatus: "\u0130mar Durumu",
      zoningPlaceholder: "\u0130marl\u0131",
      islandNumber: "Ada Numaras\u0131",
      islandPlaceholder: "214",
      parcelNumber: "Parsel Numaras\u0131",
      parcelPlaceholder: "18",
      photos: "Foto\u011fraflar",
      addMorePhotosLabel: "Daha Fazla Foto\u011fraf Ekle",
      description: "A\u00e7\u0131klama",
      descriptionPlaceholder: "\u0130lan hakk\u0131nda k\u0131sa bir a\u00e7\u0131klama yaz\u0131n.",
      submitButton: "\u0130lan\u0131 Kaydet",
      updateButton: "\u0130lan\u0131 G\u00fcncelle",
      submitting: "G\u00f6nderiliyor...",
      saving: "Kaydediliyor...",
      compressing: "S\u0131k\u0131\u015ft\u0131r\u0131l\u0131yor...",
      uploading: "Y\u00fckleniyor...",
      successMessage: "\u0130lan ba\u015far\u0131yla olu\u015fturuldu.",
      updateSuccessMessage: "\u0130lan ba\u015far\u0131yla g\u00fcncellendi.",
      latitude: "Enlem (Latitude)",
      latitudePlaceholder: "\u00f6rn. 41.0082",
      longitude: "Boylam (Longitude)",
      longitudePlaceholder: "\u00f6rn. 28.9784",
      locationSectionTitle: "Konum Belirle",
      locationSectionDescription:
        "En do\u011fru sonucu almak i\u00e7in koordinatlar\u0131 manuel girebilir, adres yazarak bulabilir veya haritadan se\u00e7ebilirsiniz.",
      manualLocationTitle: "Manuel Giri\u015f",
      addressSearchTitle: "Adres Yazarak Bul",
      addressSearchLabel: "Adres",
      addressSearchPlaceholder: "\u00f6rn. Taksim, \u0130stanbul",
      searchCoordinatesButton: "Bul",
      addressSearchSuccess: "Adres ba\u015far\u0131yla koordinata d\u00f6n\u00fc\u015ft\u00fcr\u00fcld\u00fc.",
      addressSearchNotFound: "Adres i\u00e7in koordinat bulunamad\u0131.",
      addressSearchError: "Adres aramas\u0131 s\u0131ras\u0131nda bir hata olu\u015ftu.",
      mapPickerTitle: "Haritadan Se\u00e7",
      mapPickerDescription: "Haritada bir noktaya t\u0131klayarak ya da i\u015faret\u00e7iyi s\u00fcr\u00fckleyerek konumu ayarlay\u0131n.",
      mapPickerButton: "Haritadan Se\u00e7"
    }
  },
  listingForm: {
    title: "\u0130lan Ekle",
    propertyTypeLabel: "\u0130lan Tipi",
    typeHouse: "Ev",
    typeLand: "Arsa",
    featuredLabel: "\u00d6ne \u00c7\u0131kan \u0130lan olarak i\u015faretle",
    featuredDescription: "\u00d6ne \u00e7\u0131kan ilanlar varsay\u0131lan olarak ana sayfan\u0131n en \u00fcst\u00fcnde g\u00f6r\u00fcn\u00fcr.",
    titleLabel: "Ba\u015fl\u0131k",
    titlePlaceholder: "\u00d6rn. Bo\u011faz manzaral\u0131 daire",
    listingNoLabel: "Ta\u015f\u0131nmaz \u0130lan No",
    listingNoPlaceholder: "\u00d6rn. 100245",
    priceLabel: "Fiyat",
    pricePlaceholder: "0",
    currencyLabel: "Para Birimi",
    currencyTL: "\u20ba TL",
    currencyUSD: "$ USD",
    currencyEUR: "\u20ac EUR",
    locationLabel: "Konum",
    locationPlaceholder: "\u0130stanbul",
    areaLabel: "Alan (m\u00b2)",
    areaPlaceholder: "120",
    houseSectionTitle: "Ev \u00d6zellikleri",
    houseSectionDescription: "Yaln\u0131zca eve \u00f6zel alanlar\u0131 doldurun.",
    roomCountLabel: "Oda Say\u0131s\u0131",
    roomCountPlaceholder: "3+1",
    floorLabel: "Kat Numaras\u0131",
    floorPlaceholder: "7",
    heatingLabel: "Is\u0131tma",
    heatingPlaceholder: "Merkezi Is\u0131tma",
    landSectionTitle: "Arsa \u00d6zellikleri",
    landSectionDescription: "\u0130mar ve parsel bilgilerini girin.",
    zoningLabel: "\u0130mar Durumu",
    zoningPlaceholder: "\u0130marl\u0131",
    islandLabel: "Ada Numaras\u0131",
    islandPlaceholder: "214",
    parcelLabel: "Parsel Numaras\u0131",
    parcelPlaceholder: "18",
    photosLabel: "Foto\u011fraflar",
    addMorePhotosLabel: "Daha Fazla Foto\u011fraf Ekle",
    descriptionLabel: "A\u00e7\u0131klama",
    descriptionPlaceholder: "\u0130lan hakk\u0131nda k\u0131sa bir a\u00e7\u0131klama yaz\u0131n.",
    submitButton: "\u0130lan\u0131 Kaydet",
    updateButton: "\u0130lan\u0131 G\u00fcncelle",
    submitting: "G\u00f6nderiliyor...",
    saving: "Kaydediliyor...",
    compressing: "S\u0131k\u0131\u015ft\u0131r\u0131l\u0131yor...",
    uploading: "Y\u00fckleniyor...",
    successMessage: "\u0130lan ba\u015far\u0131yla olu\u015fturuldu.",
    updateSuccessMessage: "\u0130lan ba\u015far\u0131yla g\u00fcncellendi.",
    latitudeLabel: "Enlem (Latitude)",
    latitudePlaceholder: "\u00f6rn. 41.0082",
    longitudeLabel: "Boylam (Longitude)",
    longitudePlaceholder: "\u00f6rn. 28.9784",
    locationSectionTitle: "Konum Belirle",
    locationSectionDescription: "Koordinatlar\u0131 manuel girebilir, adres yazarak bulabilir veya haritadan se\u00e7ebilirsiniz.",
    manualLocationTitle: "Manuel Giri\u015f",
    addressSearchTitle: "Adres Yazarak Bul",
    addressSearchLabel: "Adres",
    addressSearchPlaceholder: "\u00f6rn. Taksim, \u0130stanbul",
    searchCoordinatesButton: "Bul",
    addressSearchSuccess: "Adres ba\u015far\u0131yla koordinata d\u00f6n\u00fc\u015ft\u00fcr\u00fcld\u00fc.",
    addressSearchNotFound: "Adres i\u00e7in koordinat bulunamad\u0131.",
    addressSearchError: "Adres aramas\u0131 s\u0131ras\u0131nda bir hata olu\u015ftu.",
    mapPickerTitle: "Haritadan Se\u00e7",
    mapPickerDescription: "Haritada bir noktaya t\u0131klayarak ya da i\u015faret\u00e7iyi s\u00fcr\u00fckleyerek konumu ayarlay\u0131n.",
    mapPickerButton: "Haritadan Se\u00e7"
  },
  propertyCard: {
    featuredBadge: "\u00d6ne \u00c7\u0131kan",
    houseTypeBadge: "Ev",
    landTypeBadge: "Arsa",
    locationLabel: "Konum",
    areaLabel: "Alan",
    roomsLabel: "Oda",
    floorLabel: "Kat",
    heatingLabel: "Is\u0131tma",
    zoningLabel: "\u0130mar",
    islandLabel: "Ada",
    parcelLabel: "Parsel",
    listingNo: "\u0130lan No",
    viewDetails: "Detaylar\u0131 G\u00f6r",
    photosSingular: "foto\u011fraf",
    photosPlural: "foto\u011fraf"
  },
  gallery: {
    imageLabel: "foto\u011fraf",
    thumbnailAria: "\u00d6nizleme foto\u011fraf\u0131",
    openPreviewAria: "Foto\u011fraf galerisini a\u00e7",
    photoPreviewAria: "Foto\u011fraf \u00f6nizleme",
    placeholderMessage: "Hen\u00fcz foto\u011fraf eklenmedi."
  },
  deleteListing: {
    confirm: "Bu ilan silinsin mi? Bu i\u015flem geri al\u0131namaz.",
    button: "\u0130lan\u0131 Sil",
    deleting: "Siliniyor..."
  },
  communication: {
    whatsapp: "WhatsApp",
    call: "Ara",
    share: "Payla\u015f",
    copied: "Kopyaland\u0131",
    copyFailed: "Kopyalama Ba\u015far\u0131s\u0131z",
    whatsappTemplate: "Merhaba, {title} ilan\u0131 i\u00e7in bilgi almak istiyorum."
  },
  adminListings: {
    title: "\u0130lan Y\u00f6neticisi",
    description: "\u0130lanlar\u0131 y\u00f6netin, İlan No ile aray\u0131n ve kay\u0131tlar aras\u0131nda h\u0131zla ge\u00e7i\u015f yap\u0131n.",
    addButton: "Yeni \u0130lan Ekle",
    searchLabel: "İlan No, ba\u015fl\u0131k veya konuma g\u00f6re aray\u0131n",
    searchPlaceholder: "İlan No, ba\u015fl\u0131k veya konum girin",
    searchButton: "Ara",
    clearButton: "Temizle",
    thumbnail: "K\u00fc\u00e7\u00fck Resim",
    listingNo: "İlan No",
    titleColumn: "Ba\u015fl\u0131k",
    price: "Fiyat",
    edit: "D\u00fczenle",
    featured: "\u00d6ne \u00c7\u0131kan",
    status: "Durum",
    actions: "\u0130\u015flemler",
    statusHouse: "Ev",
    statusLand: "Arsa",
    featuredOn: "\u00d6ne \u00c7\u0131kan",
    featuredOff: "\u00d6ne \u00c7\u0131kan De\u011fil",
    noResults: "\u0130lan bulunamad\u0131.",
    showing: "G\u00f6steriliyor",
    listingsUnit: "ilan",
    featuredLimitReached: "Limit doldu! En fazla 10 \u00f6ne \u00e7\u0131kan ilan\u0131n\u0131z olabilir.",
    featuredUpdateFailed: "\u00d6ne \u00e7\u0131kan durum g\u00fcncellenemedi.",
    deleteTitle: "\u0130lan silinsin mi?",
    deleteDescription: "Bu ilan\u0131 silmek istedi\u011finize emin misiniz? Bu i\u015flem geri al\u0131namaz.",
    cancel: "\u0130ptal",
    delete: "\u0130lan\u0131 Sil",
    deleting: "Siliniyor...",
    previous: "\u00d6nceki",
    next: "Sonraki",
    deleteSuccessMessage: "\u0130lan silindi."
  },
  languageSwitcher: {
    label: "Dil",
    turkish: "TR",
    english: "EN"
  },
  theme: {
    toggleAria: "Temay\u0131 de\u011fi\u015ftir",
    light: "A\u00e7\u0131k",
    dark: "Koyu"
  },
  footer: {
    vision: "Gayrimenkul ke\u015ffini daha ak\u0131ll\u0131, daha h\u0131zl\u0131 ve daha g\u00fcvenilir hale getiriyoruz.",
    quickLinks: "H\u0131zl\u0131 Ba\u011flant\u0131lar",
    categories: "Kategoriler",
    contact: "\u0130leti\u015fim",
    home: "Ana Sayfa",
    allListings: "T\u00fcm \u0130lanlar",
    adminLogin: "Admin Giri\u015fi",
    apartment: "Daire",
    villa: "Villa",
    land: "Arsa",
    address: "Edirne, T\u00fcrkiye",
    phone: "+90 212 000 00 00",
    email: "info@gaspakemlak.com",
    copyright: "\u00a9 2026 Gaspak Emlak. T\u00fcm haklar\u0131 sakl\u0131d\u0131r.",
    disclaimer: "\u0130lan detaylar\u0131 bilgilendirme ama\u00e7l\u0131d\u0131r; son teyit i\u00e7in ileti\u015fime ge\u00e7iniz.",
    socialInstagram: "Instagram",
    socialFacebook: "Facebook",
    socialTwitter: "Twitter"
  },
  features: {
    badge: "KURUMSAL YAKLA\u015eIM",
    title: "Gayrimenkul deneyimini daha sade, daha \u015f\u0131k ve daha g\u00fcvenilir hale getiriyoruz.",
    subtitle: "En \u00f6zel portf\u00f6yler, profesyonel sunum ve \u015feffaf i\u015flem s\u00fcreciyle al\u0131c\u0131 ve sat\u0131c\u0131y\u0131 en do\u011fru noktada bulu\u015fturuyoruz.",
    card1_title: "\u00d6zel Portf\u00f6y",
    card1_desc: "Sizin i\u00e7in se\u00e7ilmi\u015f ilanlar",
    card2_title: "H\u0131zl\u0131 Analiz",
    card2_desc: "Detayl\u0131 kar\u015f\u0131la\u015ft\u0131rma",
    card3_title: "G\u00fcvenli",
    card3_desc: "\u015effaf i\u015flem s\u00fcreci"
  },
  feature_3_title: "G\u00fcvenli",
  feature_3_desc: "\u015effaf i\u015flem s\u00fcreci",
  propertyDetail: {
    houseTypeBadge: "Konut",
    landTypeBadge: "Arsa",
    galleryEyebrow: "Galeri",
    galleryTitle: "Foto\u011fraflar",
    galleryDescription: "\u0130lan\u0131n t\u00fcm foto\u011fraflar\u0131n\u0131 inceleyin.",
    specifications: "\u00d6zellikler",
    overview: "Genel Bak\u0131\u015f",
      description: "A\u00e7\u0131klama",
      listingNo: "Ta\u015f\u0131nmaz \u0130lan No",
      locationLabel: "Konum",
    areaLabel: "Alan",
    photosLabel: "Foto\u011fraflar",
    roomsLabel: "Oda Say\u0131s\u0131",
    floorLabel: "Kat",
    heatingLabel: "Is\u0131tma",
    zoningLabel: "\u0130mar Durumu",
    islandLabel: "Ada No",
    parcelLabel: "Parsel No",
    coordinatesLabel: "Koordinatlar",
    mapEyebrow: "Konum",
    mapTitle: "Harita Konumu",
    mapDescription: "\u0130lan\u0131n i\u015faretlenen konumunu inceleyin.",
    featuredPhotoAlt: "\u00d6ne \u00e7\u0131kan foto\u011fraf",
    placeholderAlt: "\u0130lan yer tutucu g\u00f6rseli",
    noCoordinatesTitle: "Konum eklenmedi",
    noCoordinatesDescription: "Bu ilan i\u00e7in hen\u00fcz koordinat payla\u015f\u0131lmad\u0131."
  }
} as const;

const enOverrides: Partial<Dictionary> = {};

export const dictionaries: Record<Locale, Dictionary> = {
  tr: deepMerge(sanitizeValue(tr), trOverrides as Partial<Dictionary>),
  en: deepMerge(sanitizeValue(en), enOverrides as Partial<Dictionary>)
};

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "tr";
}


