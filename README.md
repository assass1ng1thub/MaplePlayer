# MaplePlayer
Плеер с возможностью получать встроенные субтитры и аудиодорожки
------------
Для использования необходимо подключить скрипты
```html
<script src="$MANAGER_WIDGET/Common/webapi/1.0/webapis.js"></script>
<script src="mapleAVPlay.js"></script>
```
Пример использования
```javascript
mapleAVPlay.init();
mapleAVPlay.open(urlVideo, startTime);
mapleAVPlay.currentTime(getTime);
mapleAVPlay.currentTextSubtitle(subtitle);
mapleAVPlay.enableSubtitle();
```