// script.js

// Yıl bilgisini otomatik olarak eklemek için
const yearSpan = document.getElementById('currentYear');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// "Excel Oluştur" butonuna tıklama olayını dinle
document.getElementById("generate").addEventListener("click", generateExcel);

// "Nasıl Kullanılır" butonuna tıklama olayını dinle
document.querySelector('.toggle-btn').addEventListener('click', toggleLeftSidebar);

// "Form" butonuna tıklama olayını dinle
document.querySelector('.toggle-btn-right').addEventListener('click', toggleRightSidebar);

// Hata mesajı kapatma butonuna tıklama olayını dinle
document.getElementById('close-message').addEventListener('click', function () {
    document.getElementById('message').style.display = 'none';
});

// Ekran Görüntüsü alanındaki input'ları dinleme
const ekranDakikaInput = document.getElementById('ekran-dakika');
const ekranSaniyeInput = document.getElementById('ekran-saniye');
const ekranMilisaniyeInput = document.getElementById('ekran-milisaniye');
const ekranGoruntusuDisplay = document.getElementById('ekran-goruntusu-display');

[ekranDakikaInput, ekranSaniyeInput, ekranMilisaniyeInput].forEach(input => {
    input.addEventListener('input', updateEkranGoruntusu);
});

// "SINGLE" ve "ALBUM" radio butonları için olay dinleyiciler
const singleRadio = document.getElementById('single');
const albumRadio = document.getElementById('album');
const trackNumberContainer = document.getElementById('track-number-container');

singleRadio.addEventListener('change', handleTypeChange);
albumRadio.addEventListener('change', handleTypeChange);

function handleTypeChange() {
    if (albumRadio.checked) {
        trackNumberContainer.style.display = 'block';
    } else {
        trackNumberContainer.style.display = 'none';
    }
}

// Şarkı numarası seçici için olay dinleyiciler
const increaseTrackBtn = document.getElementById('increase-track');
const decreaseTrackBtn = document.getElementById('decrease-track');
const trackNumberDisplay = document.getElementById('track-number');

let trackNumber = 1; // Varsayılan olarak 1

increaseTrackBtn.addEventListener('click', function() {
    trackNumber++;
    updateTrackNumberDisplay();
});

decreaseTrackBtn.addEventListener('click', function() {
    if (trackNumber > 1) {
        trackNumber--;
        updateTrackNumberDisplay();
    }
});

function updateTrackNumberDisplay() {
    trackNumberDisplay.textContent = trackNumber + ". şarkı";
}

// Sayfa genelinde tıklama olayını dinle (Sağ sidebar kapanmayacak)
document.addEventListener('click', function(event) {
    const leftSidebar = document.getElementById('left-sidebar');
    const toggleBtn = document.querySelector('.toggle-btn');
    const isClickInsideLeftSidebar = leftSidebar.contains(event.target);
    const isClickOnToggleBtn = toggleBtn.contains(event.target);

    if (!isClickInsideLeftSidebar && !isClickOnToggleBtn) {
        leftSidebar.classList.remove('active');
    }
});

// Left Sidebar açma/kapatma fonksiyonu
function toggleLeftSidebar() {
    const leftSidebar = document.getElementById("left-sidebar");
    leftSidebar.classList.toggle('active');
}

// Right Sidebar açma/kapatma fonksiyonu
function toggleRightSidebar() {
    const rightSidebar = document.getElementById("right-sidebar");
    const toggleBtnRight = document.querySelector('.toggle-btn-right');
    rightSidebar.classList.toggle('active');

    // Buton ikonunu değiştirme
    if (rightSidebar.classList.contains('active')) {
        toggleBtnRight.innerHTML = '&#8722;'; // "-" ikonu
    } else {
        toggleBtnRight.innerHTML = '&#43;'; // "+" ikonu
    }
}

// Ekran Görüntüsü değerlerini güncelleme fonksiyonu
function updateEkranGoruntusu() {
    const dakika = (ekranDakikaInput.value || "0").padStart(2, '0');
    const saniye = (ekranSaniyeInput.value || "0").padStart(2, '0');
    const milisaniye = (ekranMilisaniyeInput.value || "0").padStart(3, '0');

    ekranGoruntusuDisplay.innerHTML = `Ekran Görüntüsü: ${dakika}.${saniye}.${milisaniye}<br>` +
        `<span class="timecode">${dakika}. <span class="unit dakika">dakika</span> ` +
        `${saniye}. <span class="unit saniye">saniye</span> ` +
        `${milisaniye}. <span class="unit milisaniye">milisaniye</span></span>`;
}

// Excel oluşturma işlevi
// script.js

// ... (diğer kodlar değişmeden kalacak)

// Excel oluşturma işlevi
async function generateExcel() {
    const messageDiv = document.getElementById('message');
    const messageText = document.getElementById('message-text');
    messageDiv.style.display = 'none'; // Önceki mesajı gizle

    try {
        // Panodan veriyi al
        const clipboardText = await navigator.clipboard.readText();

        const lines = clipboardText.split("\n").map(line => line.trim()).filter(line => line !== "");

        // 'Track #' etiketi kontrolü
        if (!lines.some(line => line.includes("Track #"))) {
            showMessage("Pano verileriniz Backstage formatıyla uyumlu değil. Kopyaladığınız verileri kontrol edip tekrar deneyin!", "error");
            return;
        }

        // Başlıklar
        const headers = [
            "ESER / SES DOSYASI ADI", "SANATÇI", "ALBUM ADI", "YAPIM ŞİRKETİ",
            "ISRC", "UPC", "Eser Tarzı", "Yayın Tarihi", "SÖZ", "MÜZİK",
            "DÜZENLEME", "KLİP YÖNETMENİ", "TÜRÜ", "ALBUM KAPAĞI (var/yok)",
            "Yorumlar", "Ekran Görüntüsü", "Şarkı Sözleri", "Açıklama"
        ];
        const rows = [];

        // Albüm bilgileri
        let albumTitle = null;
        let artistName = null;
        let upc = null;
        let label = null;

        // İlk satır kontrolü
        if (lines[0] === "chevron_left") {
            // 'person' satırını bul
            const personIndex = lines.findIndex(line => line === "person");
            if (personIndex !== -1 && lines.length > personIndex + 1) {
                albumTitle = lines[personIndex + 1].trim();
            } else {
                showMessage("Albüm adı bulunamadı. Kopyaladığınız verileri kontrol edip tekrar deneyin!", "error");
                return;
            }
        } else {
            // Eski yöntem
            albumTitle = lines[0].trim();
        }

        // Plak Şirketi ve UPC bilgilerini bulma
        const matchPatterns = {
            "Plak Şirketi": /Plak şirketi\t(.*)/i,
            "UPC": /UPC\t(.*)/i
        };

        // Zorunlu alanların kontrolü için
        let missingData = [];

        // Form alanlarından değerleri alma
        const duzenleme = document.getElementById('duzenleme').value || "";
        const klipYonetmeni = document.getElementById('klip-yonetmeni').value || "";
        const yayinTarihiInput = document.getElementById('yayin-tarihi').value;
        let yayinTarihi = "";
        if (yayinTarihiInput) {
            // Tarihi istenilen formata çevirme
            const date = new Date(yayinTarihiInput);
            yayinTarihi = date.toLocaleString('tr-TR');
        }
        const turuElements = document.getElementsByName('turu');
        let turu = "";
        for (let i = 0; i < turuElements.length; i++) {
            if (turuElements[i].checked) {
                turu = turuElements[i].value;
                break;
            }
        }

        // Ekran Görüntüsü değerini alma
        const dakika = (ekranDakikaInput.value || "0").padStart(2, '0');
        const saniye = (ekranSaniyeInput.value || "0").padStart(2, '0');
        const milisaniye = (ekranMilisaniyeInput.value || "0").padStart(3, '0');
        const ekranGoruntusu = `${dakika}.${saniye}.${milisaniye}`;

        const sarkiSozleri = document.getElementById('sarki-sozleri').value || "";
        const aciklama = document.getElementById('aciklama').value || "";

        // Track başlığı ve sütun indekslerini bulmak için değişkenler
        let isTrackSection = false;
        let trackHeaders = [];

        // Panodaki veriyi işleme
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];

            // Statik veriler (Plak Şirketi, UPC) için eşleştirme
            for (const [key, regex] of Object.entries(matchPatterns)) {
                const match = line.match(regex);
                if (match) {
                    if (key === "Plak Şirketi") label = match[1].trim();
                    if (key === "UPC") upc = match[1].trim();
                }
            }

            // Track verileri için başlıkları algılama
            if (line.startsWith("Track #")) {
                isTrackSection = true;
                trackHeaders = line.split("\t").map(header => header.trim());
            } else if (isTrackSection && line.trim() !== "") {
                // Sütun başlıklarına göre dinamik veri çekme
                const values = line.split("\t");

                // Eğer değerlerin uzunluğu başlıkların uzunluğundan küçükse, geçersiz satırdır, atla
                if (values.length < trackHeaders.length) continue;

                const trackRow = {};
                trackHeaders.forEach((header, i) => {
                    trackRow[header] = values[i]?.trim() || "";
                });

                // Zorunlu alanların kontrolü
                let trackMissingData = [];
                if (!trackRow["Track title"]) trackMissingData.push("Track title");
                if (!trackRow["Artist"]) trackMissingData.push("Artist");
                if (!trackRow["ISRC"]) trackMissingData.push("ISRC");

                if (trackMissingData.length > 0) {
                    missingData.push(...trackMissingData);
                }

                // Track Title düzenlemeleri
                let trackTitle = (trackRow["Track title"] || "")
                    .replace("Explicit", "") // Explicit'i kaldır
                    .replace(/\(.*\)/g, "")  // Parantezleri kaldır
                    .trim();

                // Feat. kontrolü
                const featMatch = trackTitle.match(/feat\. (.*)/i);
                if (featMatch) {
                    const featArtist = featMatch[1].trim();
                    trackTitle = trackTitle.replace(/feat\. (.*)/i, "").trim();
                    trackRow["Artist"] += ` feat. ${featArtist}`;
                }

                // Boş trackTitle kontrolü
                if (!trackTitle) continue;

                // Excel'e eklenecek veriler
                rows.push([
                    trackTitle, // ESER / SES DOSYASI ADI
                    trackRow["Artist"] || "", // SANATÇI
                    albumTitle || "", // ALBUM ADI
                    label || "", // YAPIM ŞİRKETİ
                    trackRow["ISRC"] || "", // ISRC
                    upc || "", // UPC
                    trackRow["Genre #1"] || "", // Eser Tarzı
                    "", // Yayın Tarihi
                    trackRow["Authors"] || "", // SÖZ
                    trackRow["Composers"] || "", // MÜZİK
                    "", // DÜZENLEME
                    "", // KLİP YÖNETMENİ
                    "", // TÜRÜ
                    "", // ALBUM KAPAĞI (var/yok)
                    "", // Yorumlar
                    "", // Ekran Görüntüsü
                    "", // Şarkı Sözleri
                    ""  // Açıklama
                ]);
            }
        }

        if (rows.length === 0) {
            showMessage("Hiçbir track verisi bulunamadı!", "error");
            return;
        }

        const totalTracks = rows.length;

        // Form verilerini uygun şarkıya uygulama
        const rightSidebar = document.getElementById('right-sidebar');
        if (rightSidebar.classList.contains('active')) {
            // Form açık, "SINGLE" veya "ALBUM" seçili mi?
            if (!singleRadio.checked && !albumRadio.checked) {
                showMessage('Lütfen "SINGLE" veya "ALBUM" seçeneğini işaretleyin.', 'error');
                return;
            }

            let targetTrackIndex = 0; // Varsayılan olarak ilk şarkı

            if (albumRadio.checked) {
                // Şarkı numarasını al
                const selectedTrackNumber = trackNumber;

                if (selectedTrackNumber < 1 || selectedTrackNumber > totalTracks) {
                    showMessage(`Albümde ${totalTracks} şarkı var. Lütfen 1 ile ${totalTracks} arasında bir şarkı numarası seçin.`, 'error');
                    return;
                }

                targetTrackIndex = selectedTrackNumber - 1; // Dizi indeksine göre ayarla
            }

            // Form verilerini ilgili satıra uygula
            rows[targetTrackIndex][7] = yayinTarihi;        // Yayın Tarihi
            rows[targetTrackIndex][10] = duzenleme;         // DÜZENLEME
            rows[targetTrackIndex][11] = klipYonetmeni;     // KLİP YÖNETMENİ
            rows[targetTrackIndex][12] = turu;              // TÜRÜ
            rows[targetTrackIndex][15] = ekranGoruntusu;    // Ekran Görüntüsü
            rows[targetTrackIndex][16] = sarkiSozleri;      // Şarkı Sözleri
            rows[targetTrackIndex][17] = aciklama;          // Açıklama

            // TÜRÜ alanı boşsa, seçili değeri ata
            if (!rows[targetTrackIndex][12]) {
                rows[targetTrackIndex][12] = singleRadio.checked ? 'SINGLE' : 'ALBUM';
            }
        }

        // Eksik verileri kullanıcıya bildirme
        if (missingData.length > 0) {
            const uniqueMissingData = [...new Set(missingData)];
            showMessage(`${uniqueMissingData.join(", ")} verileri eksik. Metadata oluşturuldu ancak dosyayı iletmeden önce bu verileri tamamlamanız gerekiyor!`, "warning");
        } else {
            messageDiv.style.display = 'none'; // Herhangi bir hata yoksa mesajı gizle
        }

        // Excel dosyası oluşturma
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "Metadata");

        // Excel dosyasını indir
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        saveAs(blob, "netd-bs-metadata.xlsx");
    } catch (err) {
        console.error("Error:", err);
        showMessage("Bir hata oluştu: " + err.message, "error");
    }
}
// Hata veya bilgi mesajlarını gösterme fonksiyonu
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    const messageText = document.getElementById('message-text');
    messageText.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}
