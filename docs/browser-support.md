# Поддержка браузеров

| Платформа | Основной режим |
| --- | --- |
| Chrome Windows | Полный функционал и выбор папки |
| Edge Windows | Полный функционал и выбор папки |
| Chrome Android | PWA, камера, QR, экспорт ZIP |
| Safari iPhone/iPad | PWA, камера, QR, fallback ZIP |
| Safari macOS | Импорт, экспорт, fallback ZIP |
| Firefox | Импорт, экспорт, fallback ZIP |

`showDirectoryPicker()` проверяется через capability detection. При отсутствии API кнопка выбора папки отключается, а пользователь видит сообщение о скачивании ZIP обычным способом.

