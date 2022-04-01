import { LightningElement, wire, api } from 'lwc';
import getProductCarImages from '@salesforce/apex/ProductCarShop.getProductCarImages';

export default class CarouselCarShop extends LightningElement {
    numbers = [];
    cars = [];
    @api carItem1 = {};
    @api carItem2 = {};
    @api carItem3 = {};
    @api carItem4 = {};

    // getProductCarImages apex method that returns List of Product (Cars)
    // It sets the CarsItems with randoms results 
    @wire(getProductCarImages)
    wiredProductImages(result) {
        const { data, error } = result;
        if (data) {
            this.numbers = get4RandomNumbers(data.length);
            let car;
            if (this.numbers) {
                this.numbers.forEach(number => {
                    car = { ...data[number] };
                    car.Description = `${car.Color__c} ${car.Brand__c} ${car.Model__c}`
                    this.cars.push(car);
                });
                this.carItem1 = this.cars[0];
                this.carItem2 = this.cars[1];
                this.carItem3 = this.cars[2];
                this.carItem4 = this.cars[3];
            }
        }
    }
}

// Function that returns 4 numbers between 0 and the Parameter (maxNumber);
function get4RandomNumbers(maxNumber) {
    let numbersArray = [];
    let number = -1;
    if (maxNumber > 3) {
        while (numbersArray.length < 4) {
            number = Math.floor(Math.random() * (maxNumber))
            if (!numbersArray.includes(number)) {
                numbersArray.push(number);
            }
        }
    } else {
        if (maxNumber == 3) {
            numbersArray = [0, 1, 2, 0];
        } else if (maxNumber == 2) {
            numbersArray = [0, 1, 0, 1];
        } else if (maxNumber == 1) {
            numbersArray = [0, 0, 0, 0];
        } else {
            return null;
        }
    }
    return numbersArray;
}