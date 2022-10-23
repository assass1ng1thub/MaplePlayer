/**
 * Для использования нужно подключить скрипт <script type="text/javascript" src="$MANAGER_WIDGET/Common/webapi/1.0/webapis.js"></script>
 */
mapleAVPlay = window.mapleAVPlay || {};

mapleAVPlay = (function () {
    "use strict";
    try {
        //#region events
        var _canPlay = new CustomEvent("canplay", {
            bubbles: true,
            composed: true
        })
        var _loadedmetadata = new CustomEvent("loadedmetadata", {
            bubbles: true,
            composed: true
        })
        var _waiting = new CustomEvent("waiting", {
            bubbles: true,
            composed: true
        })
        var _playing = new CustomEvent("playing", {
            bubbles: true,
            composed: true
        })
        var _ended = new CustomEvent("ended", {
            bubbles: true,
            composed: true
        })
        //#endregion
        //   Обект avplay, через который идет все управление 
        var _AVPlay = {};
        var _displayMode = null;
        // Флаг включения субтитров
        var _enableSubtitle = false;
        var _containerID;
        var _plugin;
        var _duration;
        var _videoWidth = null;
        var _videoHeight = null;
        var _url;
        var _audio = null;
        var _idAudio = 0;
        var _subtitle = null;
        var _idSubtitle = null;
        var _isHls = false;
        var _nCurrentTime;
        // Хранит функцию которая из вне получает время проигрывания
        var _callbackCurrentTime = null;
        // Хранит функцию которая из вне получает текст субтитров
        var _callbackTextSubtitle = null;
        //#region public functions

        var getConteiner = function () {
            return _containerID;
        }
        /**
        * Инициализирует объект плеера 
        * @param {String} __containerID - контейнер плеера
        */
        var init = function (__containerID) {
            // проверяем что это самсунг maple
            if (!(navigator.userAgent.toLowerCase().indexOf("maple") > -1)) {
                throw new Error('this is not Samsung Maple "Orsay"');
            }
            _containerID = __containerID;
            alert("conteiner 1 " + _containerID)
            webapis.avplay.getAVPlay(function (avplay) {
                _AVPlay = avplay;
                if (_AVPlay.init({ containerID: _containerID })) {
                    _containerID = _AVPlay.containerID;
                    alert("conteiner 2 " + _containerID)
                };
                _plugin = _AVPlay.setPlayerPluginObject(_containerID, null, null)
                _AVPlay.onEvent = _eventHandler;
                alert("conteiner 3 " + _containerID)
            },
                function () {
                    alert('onGetAVPlayError: ' + error.message);
                });
        }
        /**
         * 
         * @param {*} sUrl 
         * @param {*} sTime 
         */
        var open = function (sUrl, sTime) {
            _url = sUrl;
            if (sUrl.toLowerCase().indexOf(".m3u8") != -1 && sUrl.toUpperCase().indexOf("|COMPONENT=HLS") == -1) {
                _isHls = true;
                sUrl += "|COMPONENT=HLS";
                sUrl += ("|STARTTIME=" + sTime)
                sTime = null;
            }
            if (_AVPlay.open(sUrl)) {

                alert("test");
                alert(document.getElementById(_containerID))
                document.getElementById(_containerID).dispatchEvent(_canPlay);
            };
            _AVPlay.play(function () {
                alert('[mapleAVPlay:] video load');
            },
                function () {
                    throw new Error('[mapleAVPlay:] error video load');
                }, sTime);
        }
        /**
         * Запускает видео с указанной позиции
         * @param {Number} time - время в секундах 
         */
        var seekTo = function (time) {
            _AVPlay.stop();
            open(_url, time);
        }
        /**
         * Устанавливает внешнюю функцию для передачи ей текста субтитров
         * @param {Function} func 
         */
        var currentTextSubtitle = function (func) {
            _callbackTextSubtitle = func;
        }
        /**
         * Устанавливает внешнюю функцию для передачи ей времени
         * @param {Function} func 
         */
        var currentTime = function (func) {
            _callbackCurrentTime = func;
        }
        /**
         * Позволяет расширить функционал и передает объект avplay из которого можно вызвать любой доступный метод
         * @returns avplay
         */
        var getAVPlayObject = function () {
            return _AVPlay;
        }
        var getVideoWidth = function () {
            return _videoWidth;
        }
        var getVideoHeight = function () {
            return _videoHeight;
        }
        var getDuration = function () {
            return _duration;
        }
        var jumpBackward = function (s) {
            if (s >= 0 && _nCurrentTime - s * 1000 >= 0) {
                webapis._plugin(_plugin, "JumpBackward", s);
            }
        }
        var jumpForward = function (s) {
            if (s >= 0 && _AVPlay.duration - _nCurrentTime + s * 1000 >= 0) {
                webapis._plugin(_plugin, "jumpForward", s);
            }
        }
        /**
         * Устанавливает размер экрана, 0 - Оригинальный размер, 1 - растянуть на полный экран, 80-140 - установить масштаб видео
         * @param {Number} mode 
         */
        var setDisplayMethod = function (mode) {
            var xV = 960,
                yV = 540,
                aX = 0,
                aY = 0,
                aW = 960,
                aH = 540,
                cX = 0,
                cY = 0,
                pH = 100,
                pW = 100,
                cW = _videoWidth,
                cH = _videoHeight;
            switch (mode) {
                //original
                case 0:
                    if (cW / cH < 1.79) {
                        aW = yV * cW / cH;
                        aX = (xV - aW) / 2;
                    } 
                    else {
                        aH = xV * cH / cW;
                        aY = (yV - aH) / 2;
                    };
                    break;
                //full
                case 1:
                    break;
                default:
                //zoom
                if(mode >= 80 && mode <= 140){
                    alert("zoom mode" + mode);
                    pH = mode;
                    pW = mode;
                    if (pW <= 100) {
                        aW = (xV / 100) * pW;
                        aX = (xV - aW) / 2
                    }
                    else {
                        cX = cW * (pW / 200 - 0.5);
                        cW = cW * (2 - pW / 100)
                    }
                    if (pH <= 100) {
                        aH = (yV / 100) * pH;
                        aY = (yV - aH) / 2
                    }
                    else {
                        cY = cH * ((pH / 200) - 0.5);
                        cH = cH * (2 - pH / 100)
                    }
                }
                else{
                    setDisplayMethod(0);
                    return;
                }
                break;
            };
            _AVPlay.setDisplayArea({ left: aX, top: aY, width: aW, height: aH });
            if (mode != 1) {
                _AVPlay.setCropArea(_onSuccess, _onError, { left: cX, top: cY, width: cW, height: cH })
            }
            else { 
                _AVPlay.setCropArea(_onSuccess, _onError, { left: 0, top: 0, width: 0, height: 0 }) 
            }
        }
        /**
         * Воспроизводит видео поставленное на паузу
         */
        var play = function () {
            _AVPlay.resume();
        }
        /**
         * Ставит видео на паузу
         */
        var pause = function () {
            _AVPlay.pause();
        }
        /**
         * Останавливает видео
         */
        var stop = function () {
            _AVPlay.stop();
        }
        /**
        * Возвращает информацию о доступных аудиодорожках
        * @returns associative array audio ['id', 'lang']
        */
        var getAudioInfo = function () {
            return _audio;
        }
        /**
         * Включает следующую аудиодорожку
         */
        var nextAudio = function () {
            if (_audio != null) {
                if (_audio.length == _idAudio + 1) {
                    if (_AVPlay.setStreamID(1, 0)) {
                        _idAudio = 0;
                    }
                }
                else {
                    if (_AVPlay.setStreamID(1, _idAudio + 1)) {
                        _idAudio += 1;
                    }
                }
            }
        }
        /**
         * Устанавливает аудиодорожку по id
         * @param {Number} idAudio - id аудиодорожки
         */
        var setAudio = function (idAudio) {
            if (_audio[idAudio] != null) {
                if (_AVPlay.setStreamID(1, idAudio)) {
                    _idAudio = idAudio;
                }
            }
        }
        /**
         * Включает субтитры
         */
        var enableSubtitle = function () {
            _enableSubtitle = true;
        }

        /**
         * Возвращает информацию о доступных субтитрах
         * @returns associative array subtitles ['id', 'lang']
         */
        var getSubtitleInfo = function () {
            return _subtitle;
        }
        /**
         * Включает следущие субтитры
         */
        var nextSubtitle = function () {
            enableSubtitle();
            if (_subtitle != null) {
                if (_subtitle.length == _idSubtitle + 1) {
                    if (_AVPlay.setStreamID(4, 0)) {
                        _idSubtitle = 0;
                    }
                }
                else {
                    if (_AVPlay.setStreamID(4, _idSubtitle + 1)) {
                        _idSubtitle += 1;
                    }
                }
            }
        }
        /**
         * Устанавливает субтитры по id
         * @param {Number} idSubtitle - id субтитров 
         */
        var setSubtitle = function (idSubtitle) {
            enableSubtitle();
            if (_subtitle[idSubtitle] != null) {
                if (_AVPlay.setStreamID(4, idSubtitle)) {
                    _idSubtitle = idSubtitle;
                }
            }
        }
        /**
         * Выключает субтитры
         */
        var disableSubtitle = function () {
            _enableSubtitle = false;
        }
        var getState = function () {
            return _AVPlay.State2String[_AVPlay.status];
        }
        //#endregion
        //#region private functions
        // инициализирует субтитры (хз как это работает описания в документации нет, найдено эксперементальным путем)
        var _initSubtitle = function () {
            _AVPlay.startSubtitle({ path: "/dtv/temp/", streamID: 999, sync: 999, callback: function () { } });
            _idSubtitle = 0;
        }
        //извлекает информацию о субтитрах из видео
        var _getSubtitle = function () {
            var amount = _AVPlay.getTotalNumOfStreamID(4);
            if (amount > 0) {
                _subtitle = new Array(amount);
                for (var index = 0; index < _subtitle.length; index++) {
                    var lang = _AVPlay.getStreamLanguageInfo(4, index);
                    _subtitle[index] = _languageNumToStr(lang);
                }
            }
        }
        //извлекает информацию об аудиодорожках из видео
        var _getAudio = function () {
            var amount = _AVPlay.getTotalNumOfStreamID(1);
            if (amount > 0) {
                _audio = new Array(amount);
                for (var index = 0; index < _audio.length; index++) {
                    var lang = _AVPlay.getStreamLanguageInfo(1, index);
                    _audio[index] = _languageNumToStr(lang);
                }
            }
        }
        // Ковертирует числовое представление названия дорожки/субтитров в текст         
        var _languageNumToStr = function (num) {
            var str;
            //Словарь кодов озвучек
            var langAudio = {
                6384738: "Albanian",
                7565673: "Albanian",
                6647399: "English",
                6388325: "Azerbaijan",
                6386285: "Armenian",
                6448492: "Belarusian",
                6452588: "Bulgarian",
                6514793: "Chinese",
                6776178: "German",
                6911073: "Italian",
                7565409: "Spanish",
                7037306: "Kazakh",
                7040882: "Korean",
                7368562: "Portuguese",
                7501171: "Russian",
                7564399: "Slovak",
                7564406: "Slovenian",
                7565936: "Serbian",
                7632242: "Turkish",
                7699042: "Uzbek",
                7695218: "Ukrainian",
                8026747: "Ukrainian",
                6713957: "French",
                7567205: "Swedish",
                6975598: "Japanese"
            }
            if (langAudio[num] != undefined) {
                str = langAudio[num];
            }
            else {
                var nHex = num.toString(16);
                var sHex1 = "0x" + nHex.substring(0, 2);
                var sHex2 = "0x" + nHex.substring(2, 2);
                var sHex3 = "0x" + nHex.substring(4, 2);
                var str1 = String.fromCharCode(sHex1);
                var str2 = String.fromCharCode(sHex2);
                var str3 = String.fromCharCode(sHex3);
                str = str1 + str2 + str3;
                if (str === "\0\0\0") {
                    str = "Неизвестный";
                }
            }
            return str;
        }
        //#endregion
        //#region samsung events handler
        var _eventHandler = function (type, data) {
            switch (type) {
                // 1 CONNECTION_FAILED;
                case 1:
                    break;
                // 2 AUTHENTICATION_FAILED
                case 2:
                    break;
                // 3 STREAM_NOT_FOUND
                case 3:
                    alert("error 3");
                    break;
                // 4 NETWORK_DISCONNECTED
                case 4:
                    break;
                // 5 NETWORK_SLOW
                case 5:
                    break;
                // 6 RENDER_ERROR (a)
                case 6:
                    switch (data) {
                        case "0":
                            throw new VideoError("UNKNOWN_ERROR");
                        case "1":
                            throw new VideoError("UNSUPPORTED_CONTAINER");
                        case "2":
                            throw new VideoError("UNSUPPORTED_VIDEO_CODEC");
                        case "3":
                            throw new VideoError("UNSUPPORTED_AUDIO_CODEC");
                        case "4":
                            throw new VideoError("UNSUPPORTED_VIDEO_RESOLUTION");
                        case "5":
                            throw new VideoError("UNSUPPORTED_VIDEO_FRAMERATE");
                        case "6":
                            throw new VideoError("CURRUPTED_STREAM");
                        case "100":
                            throw new VideoError("CUSTOM_ERROR");
                    }
                // 7 RENDERING_START
                case 7:
                    break;
                // 8 RENDERING_COMPLETE
                case 8:
                    document.getElementById(_containerID).dispatchEvent(_ended);
                    break;
                // 9 STREAM_INFO_READY
                case 9:
                    _initSubtitle();
                    _getAudio();
                    _getSubtitle();
                    var _resolution = _AVPlay.getVideoResolution();
                    if (typeof _resolution == "string") {
                        _resolution = _resolution.split("|");
                        _videoWidth = _resolution[0];
                        _videoHeight = _resolution[1];
                    }
                    _duration = _AVPlay.getDuration();
                    document.getElementById(_containerID).dispatchEvent(_loadedmetadata);
                    setDisplayMethod('FULL_SCREEN_MODE');
                    break;
                // 10 DECODING_COMPLETE
                case 10:
                    break;
                // 11 BUFFERING_START
                case 11:
                    document.getElementById(_containerID).dispatchEvent(_waiting);
                    break;
                // 12 BUFFERING_COMPLETE
                case 12:
                    document.getElementById(_containerID).dispatchEvent(_playing);
                    break;
                // 13 BUFFERING_PROGRESS
                case 13:
                    break;
                // 14 CURRENT_PLAYBACK_TIME
                case 14:
                    _nCurrentTime = data;
                    if (typeof _callbackCurrentTime == 'function') {
                        _callbackCurrentTime(data)
                    }
                    break;
                // 15 AD_START
                case 15:
                    break;
                // 16 AD_END
                case 16:
                    break;
                // 17 RESOLUTION_CHANGED
                case 17:
                    break;
                // 18 BITRATE_CHANGED
                case 18:
                    break;
                // 19 SUBTITLE
                case 19:
                    if (_enableSubtitle && typeof _callbackTextSubtitle == 'function') {
                        _callbackTextSubtitle(data)
                    }
            }
        }
        //#endregion       

        //
        var _onError = function () {
            throw new Error('[mapleAVPlay:] error crop');
        }
        //
        var _onSuccess = function () {

            alert('[mapleAVPlay:] true crop');
        }

        var VideoError = function (message) {
            this.name = "VideoError";
            this.message = message;
        }
        VideoError.prototype = Error.prototype;

        //#region методы доступные наружу
        return {
            "init": init,
            "getConteiner": getConteiner,
            "open": open,
            "play": play,
            "pause": pause,
            "stop": stop,
            "seekTo": seekTo,
            "getState": getState,
            "setDisplayMethod": setDisplayMethod,
            "jumpBackward": jumpBackward,
            "jumpForward": jumpForward,
            "getDuration": getDuration,
            "getVideoWidth": getVideoWidth,
            "getVideoHeight": getVideoHeight,
            "getAVPlayObject": getAVPlayObject,
            "currentTime": currentTime,
            "currentTextSubtitle": currentTextSubtitle,
            "getAudioInfo": getAudioInfo,
            "setAudio": setAudio,
            "nextAudio": nextAudio,
            "enableSubtitle": enableSubtitle,
            "disableSubtitle": disableSubtitle,
            "getSubtitleInfo": getSubtitleInfo,
            "nextSubtitle": nextSubtitle,
            "setSubtitle": setSubtitle,
        }
        //#endregion
    } catch (e) {
        debuglog(e.name);
        debuglog(e.lineNumber);
        debuglog(e.message);
    }
}
)();

var debuglog = function (arg) {
    if (!window.console) {
        window.console = {
            log: function (msg) {
                alert(msg)
            }
        }
    }
    console.log('debuglog', arg);
    alert('debuglog ' + arg);
};