class jsMindApi {
    constructor(url) {
        this.url = url || 'https://v1.api.jsmind.online';
    }

    async loadByKey(key) {
        const response = await fetch(`${this.url}/mindmaps/${key}`);
        if (!response.ok) {
            throw new Error(`Can not find the mindmap, key: ${key}`);
        }
        const json = await response.json();
        if (!json.success) {
            throw new Error(`Can not find the mindmap, key: ${key}`);
        }
        return json.data;
    }


    async share(mind) {
        const response = await fetch(`${this.url}/mindmaps`, {
            method: "POST",
            body: JSON.stringify(mind),
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            }
        });
        return await response.json();
    }

    async loadSample(lang) {
        const response = await fetch(`example/data_intro_${lang}.json`);
        return await response.json();
    }
}
