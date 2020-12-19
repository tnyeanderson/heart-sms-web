export default class Platform {

    static isNativeDesktop() {
        let userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf("electron") > 0 && userAgent.indexOf("heart-sms") > 0;
    }

    static isChromeExtension() {
        return window.chrome && window.chrome.runtime && window.chrome.runtime.id !== undefined;
    }

    static isChromeApp() {
        return navigator.userAgent.toLowerCase().indexOf("chrome-app") > 0;
    }

    static isWebsite() {
        return !Platform.isChromeExtension() && !Platform.isChromeApp() && !Platform.isNativeDesktop();
    }

    static isFirefox () {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    }

    static getPlatformIdentifier() {
        if (Platform.isChromeExtension()) {
            return 1;
        } else if (Platform.isChromeApp()) {
            return 2;
        } else if (Platform.isNativeDesktop()) {
            return 3;
        } else {
            return 0; // fallback to just the web browser
        }
    }

}
