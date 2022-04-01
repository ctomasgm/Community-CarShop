import { LightningElement, track } from 'lwc';
import isGuest from '@salesforce/user/isGuest';
import basePath from "@salesforce/community/basePath";

export default class MenuBarCarShop extends LightningElement {

    get isGuest() {
        return isGuest;
    }

    get logoutUrl() {
        // site prefix is the site base path without the trailing "/s"
        const sitePrefix = basePath.replace(/\/s$/i, ""); 
        return sitePrefix + "/secur/logout.jsp";
    }

}