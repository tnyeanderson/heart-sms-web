import { Api, Url } from '@/utils/';

export default class Devices {
    static get() {
        let constructed_url = Url.get('devices') + Url.getAccountParam();
        const promise = new Promise((resolve, reject) => {
            Api.get(constructed_url)
                .then(response => {
                    resolve(response.data);
                })
                .catch(response => Api.rejectHandler(response, reject));
        });

        return promise;
    }

    static delete(id) {
        let constructed_url = Url.get('remove_device') + id + Url.getAccountParam();
        Api.post(constructed_url);
    }
}
