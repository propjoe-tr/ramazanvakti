<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Config dosyasını yükle
$config = require_once 'config.php';

// Türkiye'deki büyük şehirler listesi
$cities = [
    'Adana', 'Ankara', 'Antalya', 'Bursa', 'Denizli', 'Diyarbakır', 'Erzurum', 
    'Eskişehir', 'Gaziantep', 'Istanbul', 'İzmir', 'Kayseri', 'Konya', 'Malatya', 
    'Mersin', 'Samsun', 'Şanlıurfa', 'Trabzon', 'Van'
];

// Şehir parametresini al
$city = isset($_GET['city']) ? $_GET['city'] : 'istanbul';

try {
    // API isteği için curl başlat
    $ch = curl_init();
    
    // API endpoint ve parametreleri
    $url = $config['api_base_url'] . "?data.city=" . urlencode($city);
    
    // CURL ayarları
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $config['api_headers'],
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    // API'den yanıt al
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        throw new Exception('Curl error: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    // Yanıtı decode et
    $data = json_decode($response, true);
    
    // Debug log
    error_log('[' . date('d-M-Y H:i:s e') . '] API Raw Response: ' . $response);
    error_log('[' . date('d-M-Y H:i:s e') . '] Decoded Data: ' . print_r($data, true));
    
    if ($data && isset($data['result'])) {
        $data['cities'] = array_map(function($city) {
            return ['sehir' => $city];
        }, $cities);
    }
    echo json_encode($data);
    
} catch (Exception $e) {
    error_log('[' . date('d-M-Y H:i:s e') . '] API Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 