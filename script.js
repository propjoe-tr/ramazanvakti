document.addEventListener('DOMContentLoaded', function() {
    const ilSelect = document.getElementById('il');
    if (!ilSelect) {
        console.error('İl seçim elementi bulunamadı!');
        return;
    }

    // İlk şehir verilerini yükle ve şehir listesini al
    fetch(`api.php?city=istanbul`)
        .then(response => response.json())
        .then(data => {
            console.log('API Yanıtı:', data);
            // Şehir listesini doldur
            if (data && data.cities) {
                data.cities.forEach(il => {
                    const option = document.createElement('option');
                    option.value = il.sehir.toLowerCase();
                    option.textContent = il.sehir;
                    ilSelect.appendChild(option);
                });

                // Varsayılan şehri seç ve vakitleri göster
                ilSelect.value = 'istanbul';
                
                // Vakitleri göster
                if (data.result) {
                    updateTimes(data.result);
                }
            }
        })
        .catch(error => console.error('Veriler yüklenirken hata:', error));

    // İl seçildiğinde namaz vakitlerini güncelle
    ilSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            fetch(`api.php?city=${encodeURIComponent(e.target.value)}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.result) {
                        updateTimes(data.result);
                    }
                })
                .catch(error => console.error('Namaz vakitleri yüklenirken hata:', error));
        }
    });

    // Vakitleri güncelle
    function updateTimes(times) {
        try {
            console.log('Gelen Vakitler:', times);
            
            if (!Array.isArray(times)) {
                console.error('Geçersiz veri formatı:', times);
                return;
            }

            // Vakit eşleştirme tablosu - API'den gelen değerlerle tam eşleşmeli
            const vakitMap = {
                'İmsak': 'imsak',
                'Güneş': 'gunes',
                'Öğle': 'ogle',
                'İkindi': 'ikindi',
                'Akşam': 'aksam',
                'Yatsı': 'yatsi'
            };

            // Tüm vakitleri güncelle
            times.forEach(item => {
                const vakit = item.vakit;
                const elementId = vakitMap[vakit];
                
                console.log(`Vakit güncelleniyor: ${vakit} -> ${elementId} = ${item.saat}`);
                
                if (elementId) {
                    updateElement(elementId, item.saat);
                    
                    // Akşam vakti için sayacı başlat
                    if (vakit === 'Akşam') {
                        console.log('Akşam vakti bulundu:', item.saat);
                        updateElement('timer', item.saat);
                        startCountdown(item.saat);
                    }
                }
            });

            // İmsak ve Akşam vakitlerini bul ve progress ring'i güncelle
            const imsak = times.find(t => t.vakit === 'İmsak')?.saat;
            const aksam = times.find(t => t.vakit === 'Akşam')?.saat;
            
            if (imsak && aksam) {
                updateProgressRing(imsak, aksam);
            }

            // Bugünün tarihini göster
            const today = new Date();
            const dateStr = today.toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
            updateElement('currentDate', dateStr);

        } catch (error) {
            console.error('Vakitler güncellenirken hata:', error);
            console.error('Hata detayı:', error.stack);
        }
    }

    // Element güncelleme fonksiyonunu geliştir
    function updateElement(id, value) {
        const element = document.getElementById(id);
        console.log(`updateElement çağrıldı: #${id} = ${value}`);
        
        if (!element) {
            console.error(`Element bulunamadı: #${id}`);
            return;
        }
        
        if (!value) {
            console.error(`Değer geçersiz: ${value}`);
            return;
        }

        try {
            element.textContent = value;
            console.log(`Element güncellendi: #${id} = ${value}`);
        } catch (error) {
            console.error(`Element güncellenirken hata: #${id}`, error);
        }
    }

    // Sayaç fonksiyonunu güncelle
    function startCountdown(iftarTime) {
        if (!iftarTime) {
            console.error('İftar vakti bulunamadı');
            return;
        }

        console.log('Sayaç başlatılıyor, İftar vakti:', iftarTime);

        // Mevcut interval'i temizle
        if (window.countdownInterval) {
            clearInterval(window.countdownInterval);
        }

        const timerElement = document.getElementById('timer');
        if (!timerElement) {
            console.error('Sayaç elementi bulunamadı!');
            return;
        }

        function updateTimer() {
            try {
                const now = new Date();
                const iftar = new Date();
                const [hours, minutes] = iftarTime.split(':');
                
                // Saat ve dakikayı integer'a çevir
                const iftarHour = parseInt(hours);
                const iftarMinute = parseInt(minutes);
                
                // İftar vaktini ayarla
                iftar.setHours(iftarHour, iftarMinute, 0, 0);
                
                // Eğer iftar vakti bugün geçmişse, yarının tarihini kullan
                if (now > iftar) {
                    iftar.setDate(iftar.getDate() + 1);
                }
                
                // Kalan süreyi hesapla
                let diff = iftar - now;
                
                // Saat, dakika ve saniyeyi hesapla
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);

                // Sayacı güncelle
                timerElement.textContent = 
                    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                
                console.log('Sayaç güncellendi:', timerElement.textContent);
                
            } catch (error) {
                console.error('Sayaç güncellenirken hata:', error);
                clearInterval(window.countdownInterval);
            }
        }

        // İlk güncellemeyi hemen yap
        updateTimer();
        
        // Her saniye güncelle
        window.countdownInterval = setInterval(updateTimer, 1000);
    }

    function updateProgressRing(imsakTime, iftarTime) {
        if (!imsakTime || !iftarTime) return;

        const circle = document.querySelector('.progress-ring-circle');
        if (!circle) {
            console.error('Progress ring elementi bulunamadı!');
            return;
        }

        try {
            const now = new Date();
            const imsak = new Date();
            const iftar = new Date();
            
            const [imsakHours, imsakMinutes] = imsakTime.split(':');
            const [iftarHours, iftarMinutes] = iftarTime.split(':');
            
            imsak.setHours(parseInt(imsakHours), parseInt(imsakMinutes), 0);
            iftar.setHours(parseInt(iftarHours), parseInt(iftarMinutes), 0);
            
            const totalTime = iftar - imsak;
            const elapsedTime = now - imsak;
            const progress = Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100);
            
            const circumference = 722;
            const offset = circumference - (progress / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        } catch (error) {
            console.error('Progress ring güncellenirken hata:', error);
        }
    }
}); 