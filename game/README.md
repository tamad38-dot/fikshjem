# Kat Kat — Temelden Zirveye

Temel kaz, beton dök, vinçle kat kat yüksel. Yanlış yerleştirirsen bina yıkılır. 10.000. kata ulaşabilir misin?

Saf HTML5 Canvas + JavaScript. Derleme adımı, bağımlılık ve harici varlık yoktur.

## Çalıştırma

```sh
cd game
python3 -m http.server 8000     # veya herhangi bir statik sunucu
# http://localhost:8000
```

## Oyun akışı

1. **Kazı** — kepçeyi sürükle, basılı tutarak kaz. Çukur hedef derinliğe ulaşınca "Temel Dökümü".
2. **Temel** — basılı tutarak beton dök, yeşil bantta bırak. Kazı derinliği + döküm hassasiyeti = *temel kalitesi* (rüzgârı azaltır).
3. **İnşaat** — vinç bloğu sallar, dokun / Boşluk ile bırak. Üst katların ağırlık merkezi alttaki katın taşıyıcı yüzeyinden çıkarsa bina yıkılır.
4. Her **25. kat** geniş bir kontrol noktasıdır (haklar yenilenir, ilerleme kaydedilir). 3 hak; ıska = hak kaybı.
5. Malzemeler kata göre değişir (12 seviye: tuğla → ahşap → taş → betonarme → çelik → cam → mermer → alüminyum → karbon → titanyum → kuantum alaşım → yıldız tozu). Gökyüzü de yükseldikçe gündüzden uzaya geçer.

Kontroller: fare/dokunmatik, `Boşluk` (bırak / dök), `P` / `Esc` duraklat, `M` ses. Diller: Türkçe, English.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `core.js` | sabitler, malzeme tablosu, dil metinleri, kayıt, sentezlenmiş ses |
| `art.js` | prosedürel dokular (tuğla, taş, cam…), kat/çatı çizimi, bulut sprite'ları |
| `render.js` | gökyüzü, zemin, ekskavatör, mikser, vinç, kule, parçacıklar |
| `game.js` | oyun mantığı (kazı, döküm, denge hesabı, yıkılma), girdi, arayüz |
| `sw.js`, `manifest.webmanifest` | çevrimdışı / yüklenebilir uygulama (PWA) |

Ayar noktaları `core.js` içinde: `K.C` (kat yüksekliği, taban genişliği, kontrol noktası aralığı…) ve `K.MATS` (malzeme başlangıç katı, genişlik, yoğunluk). Hız/rüzgâr eğrileri `game.js` içinde `omega()` ve `windNow()`.

## Lisans ve satış

Kod **MIT** lisanslıdır (`LICENSE`): ticari olarak satabilir, değiştirebilir, dağıtabilirsiniz; lisans metnini ve telif satırını korumanız yeterlidir.
Tüm görseller kodla üretilir, sesler Web Audio ile sentezlenir, yazı tipi olarak sistem fontları kullanılır — üçüncü taraf telifli varlık **yoktur**.

Yayın için önerilen yollar: itch.io (klasörü zip'leyip "HTML5" olarak yükle), kendi alan adınız, ya da Capacitor / Electron ile mağaza paketi.
