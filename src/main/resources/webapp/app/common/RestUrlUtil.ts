/**
 * Util to calculate the rest urls, depending on if we are running in dev mode (i.e. not deployed as a servlet),
 * or deployed within Jira. These will be relative to the
 */
export class RestUrlUtil {

    static caclulateRestUrl(path:string) : string {
        let location:Location = window.location;

        let index:number = location.href.indexOf("/download/resources/");
        if (index > 0) {
            let url:string = location.href.substr(0, index);
            url = url + "/plugins/servlet/jirban/" + path;
            return url;
        } else if (RestUrlUtil.isLocalDebug(location)) {
            //For the local debugging of the UI, which does not seem to like loading json without a .json suffix
            index = path.indexOf("?");
            if (index > 0) {
                path = path.substr(0, index);
            }
            return path + ".json";
        }

        return path;
    }

    static calculateJiraUrl() : string {
        let location:Location = window.location;
        console.log("-----> " + location.href);
        let index:number = location.href.indexOf("/download/resources/");
        if (index > 0) {
            return location.href.substr(0, index);
        } else if (RestUrlUtil.isLocalDebug(location)) {
            //Return the locally running Jira instance since this is still where the icons etc are loaded from
            return "http://localhost:2990/jira";
        }
        console.error("Could not determine jir url " + location.href);
        return "";
    }

    private static isLocalDebug(location:Location) : boolean {
        return location.hostname === "localhost" && location.port === "3000";
    }
}