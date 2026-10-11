# Fiks hjem v26 — LiDAR geri geldi (10.10.2026)

v25 üzerine. v24 ve v25'te LiDAR yoktu: düğmeler kodda duruyordu ama gizliydi, iPhone tarafındaki
Swift eklentileri de hiçbir pakette ve Mac'teki `fikshjem` klasöründe yoktu. Bu sürümde baştan yazıldı.

## 1. Ne eklendi
**a) LiDAR ile ölçü («📏 Mål» düğmesi)**
- 28 ölçü kutusunun yanında: Terrasse, Gulv, Vegg, Tak, Trapp, Fasade, Vindusåpning, Pergola ve
  Teknisk tegning (duvar uzunluğu, tavan yüksekliği, bina eni/boyu).
- Tam ekran kamera açılır. Ortada nişangâh var: ilk noktaya tut → «＋ Sett punkt», ikinci noktaya tut →
  «＋ Sett punkt», sonra «Bruk 2,43 m». Ölçü kutuya yazılır, hesap kendiliğinden yenilenir.
- 16 Pro'da LiDAR olduğu için nişangâh yüzeyi hemen bulur. 5 metreden uzunsa «daha az hassas, iki parçada ölç» uyarısı çıkar.

**b) LiDAR ile oda tarama (Apple RoomPlan)**
- Byggemoduler → «📡 Skann rommet med LiDAR» → «Skann rommet».
- Odada yavaşça dolaşırsın, «Ferdig med rommet» → «Bruk skannet». Duvarlar, kapılar, pencereler ve tavan
  yüksekliği uygulamaya gelir; oda 2D ve 3D çizilir, kapı/pencere doğru duvara yerleşir.
- Önce oda kesikli çizgiyle gösterilir ve isim sorulur (Stue, Kjøkken …). İstersen «Forkast skanningen» ile atarsın.
- Köşeler sonradan elle sürüklenebilir.

**Tüzük:** telefon ölçer, uygulama hesaplar. Hiçbir ölçü tahmin edilmez. Taramadan odaya çevirme
(`src/lib/romplan.js`) köşeleri duvarların gerçekten kesiştiği yerden bulur.

## 2. Bu sırada bulunan ve düzeltilen hatalar
- **v25'in kendi hatası (dürüstçe):** Teknisk tegning → 4. adım, fasad kutularında (Fasadebredde, Høyde til møne,
  Raftehøyde ve pencere ölçüleri) virgüllü sayı yazılamıyordu, «9,» yazınca virgül siliniyordu. Düzeltildi ve teste eklendi.
- Teknisk tegning içinde 4 bölümde koyu yazı koyu zemin üstündeydi (okunmuyordu): byggtegning, fagtegninger,
  fasadetegning, kommunelevering. Artık açık «kâğıt» üstünde.
- «Tegn huset — fire trinn» kartlarında yazı beyaz üstüne beyazdı. Düzeldi.
- «Lukk rom» düğmesi daha koyu yeşil (okunur).
- İngilizce «Choose File / No file chosen» yerine Norveççe düğme: «📄 Last opp tegningen».
- Kontrast ve taşma testleri artık Teknisk tegning'in 4 adımını da tarıyor (önceden oraya girmiyordu).

## 3. Yeni dosyalar
- `native-plugins/fiks-lidar/` — Swift eklentisi (ARKit ölçer + RoomPlan) ve `LES-MEG.md` (ilk test adımları, olası Xcode hataları).
- `src/lib/lidar.ts` — eklentiyi uygulamaya bağlar. LiDAR yoksa (tarayıcı, eski telefon) düğmeler görünmez, her şey eskisi gibi çalışır.
- `src/lib/romplan.js` — taramayı odaya çevirir.
- `tester/romplan-test.mjs`, `tester/lidar.py`, `tester/lidar-eksempel.json`.
- `fixone-ortak/` — `romplan.js` ve `fiks-lidar/` FixOne ortak deposuna da kondu.

## 4. Test sonuçları
| Test | Sonuç |
|---|---|
| Taramadan odaya çevirme (`romplan-test.mjs`): 30° dönük dikdörtgen, L şeklinde salon, iOS 17 zemin çokgeni, hatalı veri | 16/16 |
| LiDAR akışı, simüle telefonla (`lidar.py`): «Mål» kutuyu doldurur ve yeniden hesaplar; tarama oda + 1 kapı + 2 pencere + tavan yüksekliği oluşturur ve kaydeder; LiDAR'sız cihazda düğme çıkmaz | 11/11 |
| Sistem testi (bütün sekmeler, 47 iş, her yol, arama, araçlar) | 170/170, JS hatası yok |
| AI kuralları / araçlar / Rød prikk / çizgi filmler | 14/14 · 12/12 · 15/15 · 32/32 |
| Virgüllü sayı (modül + fasad kutusu), kapat-aç kaydı, toplama listesi, «1 Mål…5 Kontroll» | hepsi geçti |
| Kötü giriş (8 modül, 45 kutu) / taşma / okunmayan yazı (artık Teknisk tegning dahil) | 0 / 0 / 0 |

## 5. Test edilemeyen (dürüst liste)
- **Swift kodu derlenmedi.** Burada Xcode yok. Kod ARKit/RoomPlan'ın bilinen kullanımına göre dikkatle yazıldı,
  ama ilk derleme ve ilk ölçüm senin 16 Pro'nda olacak. Hata çıkarsa Xcode'un verdiği mesajı bana gönder.
- Gerçek ölçü hassasiyeti: sadece telefonda görülür. Bir ölçüyü metreyle karşılaştır, farkı yaz.
- Testte telefon «simüle» edildi: uygulama tarafı (düğmeler, hesap, kayıt, çizim) tamamen test edildi;
  kamera ekranının kendisi değil.

## 6. 16 Pro'da ilk test (Mac'te)
1. `npm install`
2. Sadece ilk sefer: `npm run build && npx cap add ios`
3. `npm run ios` → Xcode açılır. Telefonu seç, ▶.
4. Byggemoduler → Terrasse → Bredde yanında «📏 Mål». İki köşe ölç, «Bruk».
5. Byggemoduler → «Skann rommet med LiDAR» → bir odayı tara.
6. Bir ölçüyü metreyle kontrol et.
