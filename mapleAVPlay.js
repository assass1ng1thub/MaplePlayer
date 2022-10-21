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
        /**
         * Инициализирует объект плеера 
         * @param {String} __containerID - контейнер плеера
         */
         var getConteiner = function () {
            return _containerID;
         }
        var init = function (__containerID) {
            // проверяем что это самсунг maple
            if (!(navigator.userAgent.toLowerCase().indexOf("maple") > -1)) {
                throw new Error('this is not Samsung Maple "Orsay"');
            }
            _containerID = __containerID;
            alert("conteiner 1 "+_containerID)
            webapis.avplay.getAVPlay(function (avplay) {
                _AVPlay = avplay;
                if (_AVPlay.init({ containerID: _containerID })) {
                    _containerID = _AVPlay.containerID;
                    alert("conteiner 2 "+_containerID)
                };
                _plugin = _AVPlay.setPlayerPluginObject(_containerID, null, null)
                _AVPlay.onEvent = _eventHandler;
                alert("conteiner 3 "+_containerID)
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
        var getVideoWidth = function(){
            return _videoWidth;
        }
        var getVideoHeight = function(){
            return _videoHeight;
        }
        var getDuration = function(){
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
        // Player.setSize = function(x_mode) {
        //     if (plmini_on) return;
        //     var x_res = 960,
        //         y_res = 540;
        //     if (this.w == 0 || this.w == '') Player.GetResolution();
        //     var area_x, area_y, area_w, area_h, crop_x, crop_y, crop_w, crop_h, text;
        //     area_x = 0;
        //     area_y = 0;
        //     area_w = 960;
        //     area_h = 540;
        //     crop_x = 0;
        //     crop_y = 0;
        //     crop_w = this.w;
        //     crop_h = this.h;
        //     if (this.w == 0 || this.w == '') return;
        //     switch (x_mode) {
        //         case 0:
        //             if (crop_w / crop_h < 1.79 || this.w == 0) {
        //                 text = 'ORIGINAL';
        //                 area_w = y_res * crop_w / crop_h;
        //                 area_x = (x_res - area_w) / 2
        //             } else {
        //                 text = 'ORIGINAL';
        //                 area_h = x_res * crop_h / crop_w;
        //                 area_y = (y_res - area_h) / 2
        //             };
        //             break;
        //         case 1:
        //             text = 'FULL';
        //             break;
        //         case 2:
        //             text = 'MANUAL';

        //                 text += " " + Pw + "%/" + Ph + "%"
    
        //             if (Pw <= 100) {
        //                 area_w = (x_res / 100) * Pw;
        //                 area_x = (x_res - area_w) / 2
        //             } else {
        //                 crop_x = crop_w * (Pw / 200 - 0.5);
        //                 crop_w = crop_w * (2 - Pw / 100)
        //             }
        //             if (Ph <= 100) {
        //                 area_h = (y_res / 100) * Ph;
        //                 area_y = (y_res - area_h) / 2
        //             } else {
        //                 crop_y = crop_h * ((Ph / 200) - 0.5);
        //                 crop_h = crop_h * (2 - Ph / 100)
        //             }
        //             break;
        //         default:
        //             Player.setSize(0);
        //             return;
        //             text = 'Не определён!';
        //             break
        //     };
        //     if (this.Sef) {
        //         this.SefPlugin.Execute('SetDisplayArea', area_x, area_y, area_w, area_h);
        //         if (x_mode != 1) this.SefPlugin.Execute('SetCropArea', crop_x, crop_y, crop_w, crop_h);
        //         else if (this.change) this.SefPlugin.Execute('SetCropArea', 0, 0, 0, 0)
        //     } else {
        //         this.plugin.SetDisplayArea(area_x, area_y, area_w, area_h);
        //         if (x_mode != 1) this.plugin.SetCropArea(crop_x, crop_y, crop_w, crop_h);
        //         else if (this.change) this.plugin.SetCropArea(0, 0, 0, 0)
        //     };
        //     lI0l1JOwNQO001Ypr(text);
        //     this.change = !0
        // };
        var setDisplayMethod = function (mode) {
            if (mode == 'COVER_SCREEN_MODE') {
                var x_res = curWidget.width,
                    y_res = curWidget.height;
                var area_x, area_y, area_w, area_h, crop_x, crop_y, crop_w, crop_h;
                area_x = 0;
                area_y = 0;
                area_w = curWidget.width;
                area_h = curWidget.height;
                crop_x = 0;
                crop_y = 0;
                crop_w = _videoWidth;
                crop_h = _videoHeight;
                var Pw = 120;
                var Ph = 120; 
            if (Pw <= 100) {
                area_w = (x_res / 100) * Pw;
                area_x = (x_res - area_w) / 2
            } else {
                crop_x = crop_w * (Pw / 200 - 0.5);
                crop_w = crop_w * (2 - Pw / 100)
            }
            if (Ph <= 100) {
                area_h = (y_res / 100) * Ph;
                area_y = (y_res - area_h) / 2
            } else {
                crop_y = crop_h * ((Ph / 200) - 0.5);
                crop_h = crop_h * (2 - Ph / 100)
            }
            // area_x, area_y, area_w, area_h
            // crop_x, crop_y, crop_w, crop_h
                _AVPlay.setDisplayArea({ left: area_x, top: area_y, width: area_w, height: area_h })
                // _AVPlay.setDisplayArea({ left: 200, top: 200, width: 500, height: 500 })
                // _AVPlay.setCropArea(_onSuccess, _onError, { left: 71, top: 71, width: 700, height: 700 })
                _AVPlay.setCropArea(_onSuccess, _onError, { left: crop_x, top: crop_y, width: crop_w, height: crop_h })
            }
            else if (mode == 'FULL_SCREEN_MODE') {
            //    _AVPlay.setDisplayRect({ left: 0, top: 0, width: 960, height: 540 })
                alert("dddddddddddddddddddddddddddddddddddddddddddddddddddddddd")
                _AVPlay.setDisplayArea({ left: 0, top: 0, width: curWidget.width, height: curWidget.height });
                // _AVPlay.setDisplayRect({ left: 0, top: 0, width: 960, height: 540 })
                // webapis._plugin(_plugin, "jumpForward", s);
               

            }
            else {
                var fitDisplayArea = _AVPlay.getFitDisplayArea(_videoWidth, _videoHeight);
                _AVPlay.setDisplayArea(fitDisplayArea)
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
        //извлекает информацию о субттрах с видео
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
        //извлекает информацию об аудиодорожках с видео
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
            "getConteiner":getConteiner,
            "open": open,
            "play": play,
            "pause": pause,
            "stop": stop,
            "seekTo": seekTo,
            "getState":getState,
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
//#region webapis functions 
// function init(option)
// function open(url, option)
// function play(successCallback, errorCallback, sec)
// function stop()
// function pause()
// function resume()
// function jumpForward(sec)
// function jumpBackward(sec)
// function setSpeed(speed)
// function setAudioStreamID(index)
// function setSubtitleStreamID(index)
// function getCurrentBitrate()
// function getAvailableBitrates()
// function startSubtitle(option)
// function stopSubtitle()
// function setSubtitleSync(millisec)
// function GetStreamLanguageInfo(index)
// function setDisplayRect(rect)
// function clear()
// function show()
// function hide()
// function getZIndex()
// function setZIndex(zIndex)
// function getVolume()
// function setVolume(volume)
// function setCropArea(successCallback, errorCallback, rect)
// function setDisplayArea(rect)
// function getDuration()
// function getVideoResolution()
// function getTotalNumOfStreamID(streamType)
// function setStreamID(streamType, index)
// function getStreamLanguageInfo(streamType, index)
// function getStreamExtraData(streamType, index)
// function setPlayerProperty(propertyType, param1, param2)
// function setTotalBufferSize(bytes)
// function setInitialBufferSize(bytes)
// function setPendingBufferSize(bytes)
// function setOutputDOT(disable)
// function setMacrovision(macrovisionLevel)
// function setVBIData(macrovisionType, cgmsType)
// function setICT(on)
// function destroy()
// function _setStatus(status)
// function setPlayerPluginObject(containerID, zIndex, pluginObjectID)
// function getSubtitleAvailable()
// function onEvent(type, data) {
// function getFitDisplayArea(width, height)

//#endregion
//#region avplay properties
// a.0.id = 0
// a.0.url = http://192.168.1.10/1.mkv
// a.0.duration = 8887924
// a.0.videoWidth = null
// a.0.videoHeight = null
// a.0.displayRect = SRect(left:0, top:0, width:960, height:540)
// a.0.displayArea = SRect(left:0, top:72, width:960, height:396)
// a.0.containerID = player_container
// a.0.zIndex = 10
// a.0.cropArea = null
// a.0.totalNumOfVideo = null
// a.0.totalNumOfAudio = null
// a.0.totalNumOfSubtitle = null
// a.0.totalBufferSize = -1
// a.0.pendingBufferSize = -1
// a.0.initialBufferSize = -1
// a.0.macrovision = false
// a.0.status = 4
// a.0.authHeader = basic
//#endregion