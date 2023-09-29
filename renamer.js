const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const downloadFolder = 'downloads';
const listFilePath = 'list.txt';

// User-Agent ayarı ekleniyor
const axiosInstance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    },
});

// Fonksiyon: Verilen URL'den video ID'sini çıkartır
function extractVideoID(url) {
    const match = url.match(/\/video\/(\d+)\b/);
    return match ? match[1] : null;
}

//
function stripHtml(html)
{
    const $ = cheerio.load(html);
    return $.text();
}

// Fonksiyon: Verilen URL'den H1 başlığı içindeki metni çeker
async function getVideoTitle(url) {
    console.log(`getVideoTitle: ` + url);
    try {
        const response = await axiosInstance.get(url); // axiosInstance kullanılıyor
        console.log( 'response.status: ' + response.status );

        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            const h1Element = $('h1');
            //console.log('H1 Element before : ' + h1Element.html() + '\n');

            // Regex kullanarak <style> etiketlerini kaldır
            let h1 = h1Element.html().replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

            // H1 içindeki tüm HTML etiketlerini temizler
            //h1Element.find('*').remove();
            //const cleanedTitle = h1Element.text().trim();
            
            // Ana başlığı boşluklarla ayırarak al
            h1 = stripHtml(h1);
            
            console.log('File Rename : ' + h1 + '\n');
            return h1;
        } else {
            console.error(`HTTP isteği başarısız. Durum kodu: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Hata: ${error.message}`);
        return null;
    }
}

// Fonksiyon: Dosya adını değiştirir
function renameFile(oldPath, newPath) {
    fs.renameSync(oldPath, newPath);
}

// Ana işlem
fs.readFile(listFilePath, 'utf-8', async (err, data) => {
    if (err) {
        console.error(`Dosya okuma hatası: ${err.message}`);
        return;
    }

    const urls = data.trim().split('\n');
    for (const url of urls) {
        const videoID = extractVideoID(url);
        if (videoID) {
            const videoTitle = await getVideoTitle(url);
            if (videoTitle) {
                const oldFilePath = `${downloadFolder}/${videoID}.mp4`;
                const newFilePath = `${downloadFolder}/${videoTitle}.mp4`;

                try {
                    renameFile(oldFilePath, newFilePath);
                    console.log(`Dosya adı değiştirildi: ${videoID}.mp4 -> ${videoTitle}.mp4`);
                } catch (error) {
                    console.error(`Dosya adı değiştirme hatası: ${error.message}`);
                }
            }
        }
    }
});
