import { LightningElement, api, wire, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';

import saveFile from '@salesforce/apex/ProductCarShop.saveFile';
import releatedFiles from '@salesforce/apex/ProductCarShop.releatedFiles';
import getModelValues from '@salesforce/apex/ProductCarShop.getModelValues';
import getBrandValues from '@salesforce/apex/ProductCarShop.getBrandValues';
import getColorValues from '@salesforce/apex/ProductCarShop.getColorValues';
import getStdPricebookId from '@salesforce/apex/ProductCarShop.getStdPricebookId';

import PRODUCT_OBJECT from '@salesforce/schema/Product2';
import PRICEBOOKENTRY_OBJECT from '@salesforce/schema/PricebookEntry';
import NAME_FIELD from '@salesforce/schema/Product2.Name';
import FAMILY_FIELD from '@salesforce/schema/Product2.Family';
import BRAND_FIELD from '@salesforce/schema/Product2.Brand__c';
import COLOR_FIELD from '@salesforce/schema/Product2.Color__c';
import MODEL_FIELD from '@salesforce/schema/Product2.Model__c';
import ACTIVE_PROD_FIELD from '@salesforce/schema/Product2.IsActive';
import ACTIVE_PBE_FIELD from '@salesforce/schema/PricebookEntry.IsActive';
import UNITPRICE_FIELD from '@salesforce/schema/PricebookEntry.UnitPrice';
import ID_PB_FIELD from '@salesforce/schema/PricebookEntry.Pricebook2Id';
import ID_PROD_FIELD from '@salesforce/schema/PricebookEntry.Product2Id';

export default class CreateProduct extends LightningElement {

    @track modelOptions;
    @track brandOptions;
    @track colorOptions;
    @api modelValue = '';
    @api brandValue = '';
    @api colorValue = '';
    @api isActive = false;
    @api price = 0;
    @api productId;
    @api pricebookEntryId;
    @api strImage = '';
    @track button_disabled = true;
    @track fileName = '';
    productName = '';
    filesUploaded = [];
    MAX_FILE_SIZE = 100000;
    file;
    fileContents;
    fileReader;
    content;


    handleNameChange(event) {
        this.productName = event.detail.value;
        this.isValidToCreate();
    }

    handleModelChange(event) {
        this.modelValue = event.detail.value;
        this.isValidToCreate();
    }

    handleBrandChange(event) {
        this.brandValue = event.detail.value;
        this.isValidToCreate();
    }

    handleColorChange(event) {
        this.colorValue = event.detail.value;
        this.isValidToCreate();
    }

    handlePriceOnChange(event) {
        this.price = event.detail.value;
        this.isValidToCreate();
    }

    handleIsActiveOnChange(event) {
        this.isActive = event.target.checked;
        this.isValidToCreate();
    }

    handleFilesChange(event) {
        if (event.target.files.length > 0) {
            this.filesUploaded = event.target.files;
            if (this.filesUploaded[0].size > this.MAX_FILE_SIZE) {
                this.fileName = 'ERROR, IMAGE TOO BIG';
                this.filesUploaded = [];
            } else {
                this.file = this.filesUploaded[0];
                this.fileName = this.filesUploaded[0].name;
            }
        }
        this.isValidToCreate();
    }

    isValidToCreate() {
        if (this.productName != '' && this.modelValue != '' && this.brandValue != '' && this.colorValue != '' && this.price > 0 && this.filesUploaded.length > 0) {
            this.button_disabled = false;
        } else {
            this.button_disabled = true;
        }
    }

    clearInputs() {
        this.price = 0;
        this.modelValue = '';
        this.productName = '';
        this.brandValue = '';
        this.colorValue = '';
        this.productId = '';
        this.fileName = '';
        this.file = null;
        this.pricebookEntryId = '';
        this.isActive = false;
        this.button_disabled = true;
    }

    @wire(getModelValues)
    wiredModelsOptions({ data, error }) {
        if (data) {
            let ops = [];
            for (let i = 0; i < data.length; i++) {
                ops.push({ label: data[i], value: data[i] });
            }

            this.modelOptions = ops;

            this.log = undefined;
        } else if (error) {
            this.log = error;
        }
    }

    @wire(getBrandValues)
    wiredBrandOptions({ data, error }) {
        if (data) {
            let ops = [];
            for (let i = 0; i < data.length; i++) {
                ops.push({ label: data[i], value: data[i] });
            }
            this.brandOptions = ops;
            this.log = undefined;
        } else if (error) {
            this.log = error;
        }
    }

    @wire(getColorValues)
    wiredColorOptions({ data, error }) {
        if (data) {
            let ops = [];
            for (let i = 0; i < data.length; i++) {
                ops.push({ label: data[i], value: data[i] });
            }
            this.colorOptions = ops;
            this.log = undefined;
        } else if (error) {
            this.log = error;
        }
    }


    createProduct() {
        var fields = {};

        fields[NAME_FIELD.fieldApiName] = this.productName;
        fields[FAMILY_FIELD.fieldApiName] = 'Transport';
        fields[MODEL_FIELD.fieldApiName] = this.modelValue;
        fields[BRAND_FIELD.fieldApiName] = this.brandValue;
        fields[COLOR_FIELD.fieldApiName] = this.colorValue;
        fields[ACTIVE_PROD_FIELD.fieldApiName] = this.isActive;

        var recordInput = { apiName: PRODUCT_OBJECT.objectApiName, fields };
        createRecord(recordInput).then(product => {
            this.productId = product.id;
            getStdPricebookId().then(id => {
                fields = {};
                fields[ACTIVE_PBE_FIELD.fieldApiName] = true;
                fields[UNITPRICE_FIELD.fieldApiName] = this.price;
                fields[ID_PB_FIELD.fieldApiName] = id;
                fields[ID_PROD_FIELD.fieldApiName] = product.id;

                var objPriceEntryRecordInput = { apiName: PRICEBOOKENTRY_OBJECT.objectApiName, fields };

                createRecord(objPriceEntryRecordInput).then(() => {
                    if (this.filesUploaded.length > 0) {
                        this.uploadHelper();
                    }
                }).catch(error => {
                    console.log(JSON.stringify(error))
                    console.log('Problem creating the pricebookEntry');
                });
            });

        }).catch(error => {
            console.log(JSON.stringify(error))
            console.log('Problem creating the product');
        });
    }

    uploadHelper() {
        // create a FileReader object 
        this.fileReader = new FileReader();
        // set onload function of FileReader object  
        this.fileReader.onloadend = (() => {
            this.fileContents = this.fileReader.result;
            let base64 = 'base64,';
            this.content = this.fileContents.indexOf(base64) + base64.length;
            this.fileContents = this.fileContents.substring(this.content);

            this.saveToFile();
        });
        this.fileReader.readAsDataURL(this.file);
    }

    saveToFile() {
        let name = Date.now().toString() + this.file.name;

        // Calling apex class to insert the file
        saveFile({ idParent: this.productId, strFileName: name, base64Data: encodeURIComponent(this.fileContents) })
            .then(result => {
                this.getRelatedFiles();
                this.UploadFile = 'File Uploaded Successfully';
                this.clearInputs();

            }).catch(error => {
                console.log(error);
            });
    }
    
    // Calling apex class to link the file with the Product DisplayUrl field
    getRelatedFiles() {
        releatedFiles({ idParent: this.productId }).catch(error => {
                console.log(error);
            });
    }

}