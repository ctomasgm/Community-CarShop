public with sharing class ProductCarShop {
    private static Pricebook2 stdPriceBook;

    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getActiveCarProducts() {
        return [SELECT Id, Product2Id, Product2.Name, Product2.Brand__c, Product2.Model__c, Product2.Color__c, Product2.DisplayUrl, UnitPrice, Product2.IsActive FROM PricebookEntry WHERE Product2.IsActive =true AND Product2.Family = 'Transport' LIMIT 50000];
    }

    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getAllProducts() {
        return [SELECT Id, Product2Id, Product2.Name, Product2.Brand__c, Product2.Model__c, Product2.Color__c, Product2.DisplayUrl, UnitPrice, Product2.IsActive FROM PricebookEntry WHERE Product2.Family = 'Transport' LIMIT 50000];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getCarProductsFiltered(String model, String brand) {
        String prodFamily = 'Transport';
 
        if(String.isBlank(model) || String.isBlank(brand)){

            if(String.isBlank(model) && String.isBlank(brand)){
                return Database.query(
                'SELECT Id, Product2Id, Product2.Name, Product2.Brand__c, Product2.Model__c,'+
                ' Product2.Color__c, Product2.DisplayUrl, UnitPrice, IsActive'+
                ' FROM PricebookEntry WHERE Product2.IsActive = true'+
                ' AND Product2.Family = :prodFamily'
            ); 
            } else if(String.isNotBlank(model)){
                return Database.query(
                    'SELECT Id, Product2Id, Product2.Name, Product2.Brand__c, Product2.Model__c,'+
                    ' Product2.Color__c, Product2.DisplayUrl, UnitPrice, Product2.IsActive'+
                    ' FROM PricebookEntry WHERE Product2.IsActive = true'+
                    ' AND Product2.Family = :prodFamily'+
                    ' AND Product2.Model__c = :model'
                );
                
            }else{
                return Database.query(
                    'SELECT Id, Product2Id, Product2.Name, Product2.Brand__c, Product2.Model__c,'+
                    ' Product2.Color__c, Product2.DisplayUrl, UnitPrice, Product2.IsActive'+
                    ' FROM PricebookEntry WHERE Product2.IsActive = true'+
                    ' AND Product2.Family = :prodFamily'+
                    ' AND Product2.Brand__c = :brand'
                );
            } 
        }else{
            return Database.query(
                'SELECT Id, Product2Id, Product2.Name, Product2.Brand__c, Product2.Model__c,'+
                ' Product2.Color__c, Product2.DisplayUrl, UnitPrice, Product2.IsActive'+
                ' FROM PricebookEntry WHERE Product2.IsActive = true'+
                ' AND Product2.Family = :prodFamily'+
                ' AND Product2.Model__c = :model'+
                ' AND Product2.Brand__c = :brand'
            ); 
        }        
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getModelValues() {
        List<String> pickListValues = new List<String>();
        Schema.DescribeFieldResult objFieldDescribe = Product2.Model__c.getDescribe();
        
        for (Schema.PicklistEntry objPickList : objFieldDescribe.getPickListValues()) {
            pickListValues.add(objPickList.getValue());
        }
        return pickListValues;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<String> getBrandValues() {
        List<String> pickListValues = new List<String>();
        Schema.DescribeFieldResult objFieldDescribe = Product2.Brand__c.getDescribe();
        
        for (Schema.PicklistEntry objPickList : objFieldDescribe.getPickListValues()) {
            pickListValues.add(objPickList.getValue());
        }
        return pickListValues;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getColorValues() {
        List<String> pickListValues = new List<String>();
        Schema.DescribeFieldResult objFieldDescribe = Product2.Color__c.getDescribe();
        
        for (Schema.PicklistEntry objPickList : objFieldDescribe.getPickListValues()) {
            pickListValues.add(objPickList.getValue());
        }
        return pickListValues;
    }

    @AuraEnabled(cacheable=true)
    public static ID getStdPricebookId() {
        if (stdPriceBook == null){
            stdPriceBook = [SELECT id, name FROM Pricebook2 WHERE isStandard = true limit 1];
        }
        return stdPriceBook.Id; 
    }

    @AuraEnabled(cacheable=true)
    public static List<Product2> getProductCarImages() {
        String prodFamily = 'Transport';
        return [SELECT Id, Name, Model__c, Brand__c, Color__c, DisplayUrl FROM Product2 WHERE Product2.Family = :prodFamily AND DisplayUrl != null];
    }

    @AuraEnabled
    public static ContentVersion saveFile(Id idParent, String strFileName, String base64Data) {
        // Decoding base64Data
        base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
        
        // inserting file
        ContentVersion cv = new ContentVersion();
        cv.Title = strFileName;
        cv.PathOnClient = '/' + strFileName;
        cv.FirstPublishLocationId = idParent;
        cv.VersionData = EncodingUtil.base64Decode(base64Data);
        cv.IsMajorVersion = true;
        Insert cv;
        return cv;
    }

    @AuraEnabled
    public static String releatedFiles(Id idParent){
        list<id> lstConDocs = new list<id>();
        for(ContentDocumentLink cntLink : [Select Id, ContentDocumentId From ContentDocumentLink Where LinkedEntityId =:idParent]) {
            lstConDocs.add(cntLink.ContentDocumentId);
        }
        if(!lstConDocs.isEmpty()) {
            ContentDistribution cdl = new ContentDistribution();
            cdl.ContentVersionId = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs LIMIT 1].Id;
            cdl.Name = 'PublicShare';
            insert cdl;
            Product2 p = new Product2();
            p.id = idParent;

            p.DisplayUrl = [SELECT DistributionPublicUrl, ContentDownloadUrl FROM ContentDistribution WHERE Id = :cdl.Id LIMIT 1].ContentDownloadUrl;
            update p;
            return [SELECT DistributionPublicUrl, ContentDownloadUrl FROM ContentDistribution WHERE Id = :cdl.Id LIMIT 1].ContentDownloadUrl;
        }
        else {
            return null;
        }
     
    }

}