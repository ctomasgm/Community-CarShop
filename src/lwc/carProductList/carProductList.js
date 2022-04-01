import { LightningElement, track, wire, api } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import isguest from '@salesforce/user/isGuest';

import getCarProductsFiltered from '@salesforce/apex/ProductCarShop.getCarProductsFiltered';
import getActiveCarProducts from '@salesforce/apex/ProductCarShop.getActiveCarProducts';
import getAllProducts from '@salesforce/apex/ProductCarShop.getAllProducts';
import getModelValues from '@salesforce/apex/ProductCarShop.getModelValues';
import getBrandValues from '@salesforce/apex/ProductCarShop.getBrandValues';

import NAME_FIELD from '@salesforce/schema/Product2.Name';
import BRAND_FIELD from '@salesforce/schema/Product2.Brand__c';
import COLOR_FIELD from '@salesforce/schema/Product2.Color__c';
import MODEL_FIELD from '@salesforce/schema/Product2.Model__c';
import ACTIVE_PROD_FIELD from '@salesforce/schema/Product2.IsActive';
import UNITPRICE_FIELD from '@salesforce/schema/PricebookEntry.UnitPrice';


export default class CarProductList extends LightningElement {
    @track products;
    @track brandOptions;
    @track modelOptions;

    @api brandValue = '';
    @api modelValue = '';
    @track isCreateProductModalOpen = false;
    @track isGuestUser = isguest;
    @track isEditMode = false;
    productListToUpdate = [];
    wiredProductResult;
    wiredAllProductResult;

    @track columns = [
        { label: 'Name', fieldName: 'Name', type: 'text', editable: this.isEditMode },
        { label: 'Model', fieldName: 'productModel__c', type: 'text', editable: this.isEditMode },
        { label: 'Brand', fieldName: 'productBrand__c', type: 'text', editable: this.isEditMode },
        { label: 'Image', fieldName: 'productDisplayUrl', type: 'image', editable: this.isEditMode },
        { label: 'Color', fieldName: 'productColor__c', type: 'text', editable: this.isEditMode },
        { label: 'Price', fieldName: 'UnitPrice', type: 'currency', editable: this.isEditMode },
    ];

    @wire(getActiveCarProducts)
    wiredProducts(result) {
        const { data, error } = result;

        this.wiredProductResult = result;
        if (data) {
            this.products = data.map(row => {
                return {
                    ...row,
                    Name: row.Product2.Name,
                    productModel__c: row.Product2.Model__c,
                    productBrand__c: row.Product2.Brand__c,
                    productDisplayUrl: row.Product2.DisplayUrl,
                    productColor__c: row.Product2.Color__c,
                    IsActive: row.Product2.IsActive
                }
            })
        }
    }

    @wire(getAllProducts)
    wiredAllProducts(result) {
        const { data, error } = result;

        this.wiredAllProductResult = result;
        if (data) {
            this.products = data.map(row => {
                return {
                    ...row,
                    Name: row.Product2.Name,
                    productModel__c: row.Product2.Model__c,
                    productBrand__c: row.Product2.Brand__c,
                    productDisplayUrl: row.Product2.DisplayUrl,
                    productColor__c: row.Product2.Color__c,
                    IsActive: row.Product2.IsActive
                }
            })
        }
    }

    handleModelChange(event) {
        this.modelValue = event.detail.value;
        this.handleFiltersChange()
    }
    handleBrandChange(event) {
        this.brandValue = event.detail.value;
        this.handleFiltersChange()
    }

    handleFiltersClear() {
        this.brandValue = '';
        this.modelValue = '';
        this.refreshProducts(this.isEditMode)
    }


    handleFiltersChange() {
        let model = this.modelValue ? this.modelValue : null;
        let brand = this.brandValue ? this.brandValue : null;

        getCarProductsFiltered({ model, brand })
            .then(result => {
                if (result) {
                    this.products = result.map(row => {
                        return {
                            ...row,
                            Name: row.Product2.Name,
                            productModel__c: row.Product2.Model__c,
                            productBrand__c: row.Product2.Brand__c,
                            productDisplayUrl: row.Product2.DisplayUrl,
                            productColor__c: row.Product2.Color__c,
                            IsActive: row.Product2.IsActive
                        }
                    })
                }
            }).catch(error => {
                console.error(error);
            })
    }

    @wire(getModelValues)
    wiredModelsOptions({ data, error }) {
        if (data) {
            let ops = [];
            for (let i = 0; i < data.length; i++) {
                ops.push({ label: data[i], value: data[i] });
            }

            this.modelOptions = ops;
        } else if (error) {
            console.error(error);
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
        } else if (error) {
            console.error(error);
        }
    }

    openCreateProductModal() {
        // to open modal set isCreateProductModalOpen value as true
        this.isCreateProductModalOpen = true;
    }

    closeCreateProductModal() {
        // to close modal set isCreateProductModalOpen value as false
        this.isCreateProductModalOpen = false;
    }

    handleEditModeChange(event) {
        this.isEditMode = event.detail.checked;

        if (this.isEditMode)
            this.refreshProducts(true);
        else
            this.refreshProducts(false);
    }

    handleSave(event) {
        event.detail.draftValues.forEach(productModified => {
            this.products.forEach(product => {
                if (productModified.Id == product.Id) {
                    let newProdObj = {
                        ...productModified,
                        Product2: {
                            Id: product.Product2.Id
                        }
                    }
                    this.productListToUpdate.push(newProdObj);
                }
            });
        });

        this.updateProducts();
    }

    updateProducts() {
        let fieldsProductArray = [];
        let fieldsPriceBookArray = [];
        this.productListToUpdate.forEach(itemUpdated => {
            let fields = {};
            let hasFields = false;

            if (itemUpdated.Name) {
                fields[NAME_FIELD.fieldApiName] = itemUpdated.Name;
                hasFields = true;
            }

            if (itemUpdated.productModel__c) {
                fields[MODEL_FIELD.fieldApiName] = itemUpdated.productModel__c;
                hasFields = true;
            }
            if (itemUpdated.productBrand__c) {
                fields[BRAND_FIELD.fieldApiName] = itemUpdated.productBrand__c;
                hasFields = true;
            }
            if (itemUpdated.productColor__c) {
                fields[COLOR_FIELD.fieldApiName] = itemUpdated.productColor__c;
                hasFields = true;
            }
            if (itemUpdated.IsActive !== undefined) {
                fields[ACTIVE_PROD_FIELD.fieldApiName] = itemUpdated.IsActive;
                hasFields = true;
            }

            if (hasFields) {
                fields['Id'] = itemUpdated.Product2.Id;
                fieldsProductArray.push(fields);
            }

            let isPriceUpdated = true;
            fields = {};

            if (itemUpdated.UnitPrice)
                fields[UNITPRICE_FIELD.fieldApiName] = itemUpdated.UnitPrice;
            else
                isPriceUpdated = false;

            if (isPriceUpdated) {
                fields['Id'] = itemUpdated.Id;
                fieldsPriceBookArray.push(fields);
            }
        });

        const productPromises = fieldsProductArray.map(fields => {
            let recordInput = { fields }
            return updateRecord(recordInput);
        });

        const priceBookPromises = fieldsPriceBookArray.map(fields => {
            let recordInput = { fields }
            return updateRecord(recordInput);
        });

        Promise.all(productPromises, priceBookPromises).then(() => {
            this.refreshProducts(true);
        }).catch(error => {
            console.error(error);
        }).finally(() => {
            this.productListToUpdate = [];
        });
    }

    refreshProducts(isGetAllProducts) {
        if (isGetAllProducts) {
            this.columns = [
                { label: 'Name', fieldName: 'Name', type: 'text', editable: this.isEditMode },
                { label: 'Model', fieldName: 'productModel__c', type: 'text', editable: this.isEditMode },
                { label: 'Brand', fieldName: 'productBrand__c', type: 'text', editable: this.isEditMode },
                { label: 'Image', fieldName: 'productDisplayUrl', type: 'image', editable: this.isEditMode },
                { label: 'Color', fieldName: 'productColor__c', type: 'text', editable: this.isEditMode },
                { label: 'Price', fieldName: 'UnitPrice', type: 'currency', editable: this.isEditMode },
                { label: 'Active', fieldName: 'IsActive', type: 'boolean', editable: this.isEditMode }
            ];
            getAllProducts().then(result => {
                if (result) {
                    let temp = result.map(row => {
                        return {
                            ...row,
                            Name: row.Product2.Name,
                            productModel__c: row.Product2.Model__c,
                            productBrand__c: row.Product2.Brand__c,
                            productDisplayUrl: row.Product2.DisplayUrl,
                            productColor__c: row.Product2.Color__c,
                            IsActive: row.Product2.IsActive,
                        }
                    })
                    this.products = [...temp];
                    refreshApex(this.wiredAllProductResult);
                }
            }).catch(error => {
                console.error(error);
            });

        } else {

            this.columns = [
                { label: 'Name', fieldName: 'Name', type: 'text', editable: this.isEditMode },
                { label: 'Model', fieldName: 'productModel__c', type: 'text', editable: this.isEditMode },
                { label: 'Brand', fieldName: 'productBrand__c', type: 'text', editable: this.isEditMode },
                { label: 'Image', fieldName: 'productDisplayUrl', type: 'image', editable: this.isEditMode },
                { label: 'Color', fieldName: 'productColor__c', type: 'text', editable: this.isEditMode },
                { label: 'Price', fieldName: 'UnitPrice', type: 'currency', editable: this.isEditMode },
            ];

            getActiveCarProducts().then(result => {
                if (result) {
                    let temp = result.map(row => {
                        return {
                            ...row,
                            Name: row.Product2.Name,
                            productModel__c: row.Product2.Model__c,
                            productBrand__c: row.Product2.Brand__c,
                            productDisplayUrl: row.Product2.DisplayUrl,
                            productColor__c: row.Product2.Color__c
                        }
                    })
                    this.products = [...temp];
                    this.isEditMode = false;
                    refreshApex(this.wiredProductResult);
                }
            }).catch(error => {
                console.error(error);
            });
        }
    }
}