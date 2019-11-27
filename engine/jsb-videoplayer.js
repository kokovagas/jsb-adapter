/****************************************************************************
 Copyright (c) 2018 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

(function () {
    if (!(cc && cc.VideoPlayer && cc.VideoPlayer.Impl)) {
        return;
    }

    var _worldMat = new cc.Mat4();
    var _cameraMat = new cc.Mat4();

    var _impl = cc.VideoPlayer.Impl;
    var _p = cc.VideoPlayer.Impl.prototype;

    _p._bindEvent = function () {
        let video = this._video,
            self = this;

        if (!video) {
            return;
        }

        //binding event
        let cbs = this.__eventListeners;
        cbs.loadedmetadata = function () {
            self._loadedmeta = true;
            self._dispatchEvent(_impl.EventType.META_LOADED);
        };
        cbs.ended = function () {
            if (self._video !== video) return;
            self._playing = false;
            self._dispatchEvent(_impl.EventType.COMPLETED);
        };
        cbs.play = function () {
            if (self._video !== video) return;
            self._playing = true;
            self._dispatchEvent(_impl.EventType.PLAYING);
        };
        cbs.pause = function () {
            if (self._ignorePause || self._video !== video) return;
            self._playing = false;
            self._dispatchEvent(_impl.EventType.PAUSED);
        };
        cbs.click = function () {
            self._dispatchEvent(_impl.EventType.CLICKED);
        };
        cbs.stoped = function () {
            self._dispatchEvent(_impl.EventType.STOPPED);
            self._ignorePause = false;
        };

        video.addEventListener("loadedmetadata", cbs.loadedmetadata);
        video.addEventListener("ended", cbs.ended);
        video.addEventListener("play", cbs.play);
        video.addEventListener("pause", cbs.pause);
        video.addEventListener("click", cbs.click);
        video.addEventListener("stoped", cbs.stoped);

        function onCanPlay() {
            if (this._loaded)
                return;

            this._loaded = true;
            this._dispatchEvent(_impl.EventType.READY_TO_PLAY);
            this._updateVisibility();
        }

        cbs.onCanPlay = onCanPlay.bind(this);
        video.addEventListener('canplay', cbs.onCanPlay);
        video.addEventListener('canplaythrough', cbs.onCanPlay);
        video.addEventListener('suspend', cbs.onCanPlay);
    };

    _p._updateVisibility = function () {
        if (!this._video) return;
        let video = this._video;
        if (this._visible) {
            this._video.setVisible(true);
        } else {
            this._video.setVisible(false);
            video.pause();
            this._playing = false;
        }
    };

    _p._updateSize = function (width, height) {

    };

    _p.createDomElementIfNeeded = function () {
        if (!jsb.VideoPlayer) {
            cc.warn('VideoPlayer is not supported.');
            return null;
        }

        if (!this._video) {
            this._video = new jsb.VideoPlayer();
        }
    };

    _p.removeDom = function () {
        let video = this._video;
        if (video) {
            this._video.stop()
            this._video.setVisible(false)

            let cbs = this.__eventListeners;

            cbs.loadedmetadata = null;
            cbs.ended = null;
            cbs.play = null;
            cbs.pause = null;
            cbs.click = null;
            cbs.onCanPlay = null;
        }

        this._video = null;
        this._url = "";
    };

    _p.setURL = function (path) {
        let source, extname;

        if (this._url === path) {
            return;
        }

        this.removeDom();

        this._url = path;
        this.createDomElementIfNeeded();
        this._bindEvent();

        let video = this._video;
        if (!video) {
            return;
        }

        video.setVisible(this._visible);

        this._loaded = false;
        this._played = false;
        this._playing = false;
        this._loadedmeta = false;

        video.setURL(this._url);
        this._forceUpdate = true;
    };

    _p.getURL = function() {
        return this._url;
    };

    _p.play = function () {
        let video = this._video;
        if (!video || !this._visible || this._playing) return;

        video.play();
        this._playing = true;
    };

    _p.pause = function () {
        let video = this._video;
        if (!this._playing || !video) return;

        video.pause();
        this._playing = false;
    };

    _p.resume = function () {
        let video = this._video;
        if (this._playing || !video) return;

        video.resume();
        this._playing = true;
    };

    _p.stop = function () {
        let video = this._video;
        if (!video || !this._visible) return;
        this._ignorePause = true;

        video.stop();
        this._playing = false;
    };

    _p.setVolume = function (volume) {

    };


    _p.seekTo = function (time) {
        let video = this._video;
        if (!video) return;

        if (this._loaded) {
            video.seekTo(time)
        } else {
            let cb = function () {
                video.seekTo(time)
            };
            video.addEventListener(_impl._polyfill.event, cb);
        }
        if (_impl._polyfill.autoplayAfterOperation && this.isPlaying()) {
            setTimeout(function () {
                video.play();
            }, 20);
        }
    };

    _p.isPlaying = function () {
        return this._playing;
    };

    _p.duration = function () {
        let video = this._video;
        let duration = -1;
        if (!video) return duration;

        duration = video.duration();
        if (duration <= 0) {
            cc.logID(7702);
        }

        return duration;
    };


    _p.currentTime = function () {
        let video = this._video;
        if (!video) return -1;

        return video.currentTime();
    };

    _p.setKeepAspectRatioEnabled = function (isEnabled) {
        if (!this._video) {
            return false;
        }
        return this._video.setKeepAspectRatioEnabled(isEnabled);
    };

    _p.isKeepAspectRatioEnabled = function () {
        if (!this._video) {
            return false;
        }
        return this._video.isKeepAspectRatioEnabled();
    };

    _p.isFullScreenEnabled = function () {
        return this._fullScreenEnabled;
    };

    _p.setEventListener = function (event, callback) {
        this._EventList[event] = callback;
    };

    _p.removeEventListener = function (event) {
        this._EventList[event] = null;
    };

    _p._dispatchEvent = function (event) {
        let callback = this._EventList[event];
        if (callback)
            callback.call(this, this, this._video.src);
    };

    _p.onPlayEvent = function () {
        let callback = this._EventList[_impl.EventType.PLAYING];
        callback.call(this, this, this._video.src);
    };

    _p.enable = function () {
        let list = _impl.elements;
        if (list.indexOf(this) === -1)
            list.push(this);
        this.setVisible(true);
    };

    _p.disable = function () {
        let list = _impl.elements;
        let index = list.indexOf(this);
        if (index !== -1)
            list.splice(index, 1);
        this.setVisible(false);
    };

    _p.destroy = function () {
        this.disable();
        this.removeDom();
    };

    _p.setVisible = function (visible) {
        if (this._visible !== visible) {
            this._visible = !!visible;
            this._updateVisibility();
        }
    };

    _p.setFullScreenEnabled = function (enable) {
        let video = this._video;
        if (!video) {
            return;
        }
        this._fullScreenEnabled = enable;
        video.setFullScreenEnabled(enable);
    };

    _p.updateMatrix = function (node) {
        if (!this._video || !this._visible) return;

        node.getWorldMatrix(_worldMat);
        if (!this._forceUpdate &&
            this._m00 === _worldMat.m[0] && this._m01 === _worldMat.m[1] &&
            this._m04 === _worldMat.m[4] && this._m05 === _worldMat.m[5] &&
            this._m12 === _worldMat.m[12] && this._m13 === _worldMat.m[13] &&
            this._w === node._contentSize.width && this._h === node._contentSize.height) {
            return;
        }

        // update matrix cache
        this._m00 = _worldMat.m[0];
        this._m01 = _worldMat.m[1];
        this._m04 = _worldMat.m[4];
        this._m05 = _worldMat.m[5];
        this._m12 = _worldMat.m[12];
        this._m13 = _worldMat.m[13];
        this._w = node._contentSize.width;
        this._h = node._contentSize.height;

        let camera = cc.Camera.findCamera(node);
        camera.getWorldToScreenMatrix2D(_cameraMat);
        cc.Mat4.multiply(_cameraMat, _cameraMat, _worldMat);

        let viewScaleX = cc.view._scaleX,
            viewScaleY = cc.view._scaleY;
        let dpr = cc.view._devicePixelRatio;
        viewScaleX /= dpr;
        viewScaleY /= dpr;

        let finalScaleX = _cameraMat.m[0] * viewScaleX,
            finalScaleY = _cameraMat.m[5] * viewScaleY;

        let finalWidth = this._w * finalScaleX,
            finalHeight = this._h * finalScaleY;

        let appx = finalWidth * node._anchorPoint.x;
        let appy = finalHeight * node._anchorPoint.y;

        let viewport = cc.view._viewportRect;
        let offsetX = viewport.x / dpr,
            offsetY = viewport.y / dpr;

        let tx = _cameraMat.m[12] * viewScaleX - appx + offsetX,
            ty = _cameraMat.m[13] * viewScaleY - appy + offsetY;

        var height = cc.view.getFrameSize().height;
        this._video.setFrame(tx, height - finalHeight - ty, finalWidth, finalHeight);
        this._forceUpdate = false;
    };

    _impl.EventType = {
        PLAYING: 0,
        PAUSED: 1,
        STOPPED: 2,
        COMPLETED: 3,
        META_LOADED: 4,
        CLICKED: 5,
        READY_TO_PLAY: 6
    };

    // video 队列，所有 vidoe 在 onEnter 的时候都会插入这个队列
    _impl.elements = [];
    // video 在 game_hide 事件中被自动暂停的队列，用于回复的时候重新开始播放
    _impl.pauseElements = [];

    cc.game.on(cc.game.EVENT_HIDE, function () {
        let list = _impl.elements;
        for (let element, i = 0; i < list.length; i++) {
            element = list[i];
            if (element.isPlaying()) {
                element.pause();
                _impl.pauseElements.push(element);
            }
        }
    });

    cc.game.on(cc.game.EVENT_SHOW, function () {
        let list = _impl.pauseElements;
        let element = list.pop();
        while (element) {
            element.play();
            element = list.pop();
        }
    });
})();
