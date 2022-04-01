import { LightningElement,api } from 'lwc';
 
export default class Photo extends LightningElement {
    @api url;
    @api altText;
}