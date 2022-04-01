import { LightningElement, track, wire, api } from 'lwc';
import { exportCSVFile } from './carShopUtils';
import { loadScript } from "lightning/platformResourceLoader";
import getModelValues from '@salesforce/apex/ProductCarShop.getModelValues';
import JSPDF from '@salesforce/resourceUrl/jspdf';
import JSPDF_AUTO_TABLE from '@salesforce/resourceUrl/autotable';

export default class CarShopSimulator extends LightningElement {

    @track products;
    @track modelOptions;
    @track termValue;
    @track modelValue;
    @track payments;
    @track amount = 0;
    @track downPayment = 0;
    @track calculate_disabled = true;
    @track download_disabled = true;

    termOptions = [
        { label: '6 Months', value: '6 Months' }, { label: '12 Months', value: '12 Months' },
        { label: '18 Months', value: '18 Months' }, { label: '24 Months', value: '24 Months' },
        { label: '30 Months', value: '30 Months' }, { label: '36 Months', value: '36 Months' },
        { label: '42 Months', value: '42 Months' }, { label: '48 Months', value: '48 Months' },
        { label: '54 Months', value: '54 Months' }, { label: '60 Months', value: '60 Months' }
    ];

    columns = [
        { label: '#Pay', fieldName: 'numberPayment', type: 'text' },
        { label: 'Unpaid Auto Balance', fieldName: 'unpaidAutoBala', type: 'currency' },
        { label: 'Monthly Auto Capital Payment', fieldName: 'monthAutoCapPay', type: 'currency' },
        { label: 'Montly Payment of Auto Interest', fieldName: 'monthPayAutoInter', type: 'currency' },
        { label: 'Total Payment with VAT', fieldName: 'totalPayVAT', type: 'currency' },
    ];

    headersCSV = {
        numberPayment: '#Pay',
        unpaidAutoBala: 'Unpaid Auto Balance',
        monthAutoCapPay: 'Monthly Auto Capital Payment',
        monthPayAutoInter: 'Montly Payment of Auto Interest',
        totalPayVAT: 'Total Payment with VAT'
    }

    @wire(getModelValues)
    wiredModelsOptions({ data, error }) {
        if (data) {
            let ops = [];
            for (let i = 0; i < data.length; i++)
                ops.push({ label: data[i], value: data[i] });
                
            this.modelOptions = ops;
        } else if (error) {
            console.error(error);
        }
    }

    handleModelChange(event) {
        this.modelValue = event.detail.value;
        this.isCalculateButtonDisabled();
    }

    handleTermChange(event) {
        this.termValue = event.detail.value;
        this.isCalculateButtonDisabled();
    }

    handleAmountOnChange(event) {
        this.amount = event.detail.value;
        this.isCalculateButtonDisabled();
    }

    handleDownPaymentOnChange(event) {
        this.downPayment = event.detail.value;
        this.isCalculateButtonDisabled();
    }

    isCalculateButtonDisabled() {
        if (this.termValue && this.amount > 0 && this.termValue) {
            this.calculate_disabled = false;
        }
    }

    handleCalculate() {
        this.calculatePayments();
    }

    calculatePayments() {
        let term = parseInt(this.termValue);
        let amount = this.amount;
        let downPayment = this.downPayment;
        let rows = []

        for (let i = 0; i < term; i++) {
            let unpaidAutoBala = parseFloat((amount - downPayment) - (i * (amount - downPayment) / term)).toFixed(2);
            let monthAutoCapPay = parseFloat((amount - downPayment) / term).toFixed(2);
            let monthPayAutoInter = parseFloat(unpaidAutoBala * (7.5 / 12) / 100).toFixed(2);
            let totalPayVAT = parseFloat(monthAutoCapPay) + (parseFloat(monthPayAutoInter) * 1.08);
            totalPayVAT = parseFloat(totalPayVAT).toFixed(2);

            rows.push({
                numberPayment: i + 1,
                unpaidAutoBala: unpaidAutoBala,
                monthAutoCapPay: monthAutoCapPay,
                monthPayAutoInter: monthPayAutoInter,
                totalPayVAT: totalPayVAT,
            });
        }
        this.payments = rows;
        this.download_disabled = false;
    }

    handleDownloadCSV() {
        exportCSVFile(this.headersCSV, this.payments, this.getFileName());

    }
    handleDownloadPDF() {
        this.generatePDF();
    }

    getFileName() {
        let date = new Date();
        return `${date.getDate()}${(date.getMonth() + 1)}${date.getFullYear()}${date.getHours()}${date.getMinutes()}`
    }

    renderedCallback() {
        Promise.all([
            loadScript(this, JSPDF),
            loadScript(this, JSPDF_AUTO_TABLE)
        ]).catch(() => {
            console.log("Scripts not loaded");
        })
    }

    generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.autoTable({
            head: this.generatePDFHeaders(),
            body: this.generateBody(),
        });
        doc.save(`${this.getFileName()}.pdf`);
    }

    generatePDFHeaders() {
        let header = [];
        this.columns.forEach(column => {
            header.push(column.label)
        });
        return [[...header]];
    }

    generateBody() {
        let bodyArray = [];
        let bodyItem = [];
        this.payments.forEach(payment => {
            bodyItem = [];
            for (const entry in payment) {
                if (typeof payment[entry] === 'string')
                    bodyItem.push(`\$${payment[entry]}`);
                else
                    bodyItem.push(payment[entry]);
            }
            bodyArray.push(bodyItem);
        });
        return bodyArray;
    }
}