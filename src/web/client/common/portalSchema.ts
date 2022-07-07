export const portal_schema_data = {
    "entities":{
       "organization":[
          {
             "api":"api",
             "data":"data",
             "version":"v9.1",
             "fetchUrlSingleEntity":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}({entityId})",
             "fetchUrlForEntityRoot":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}",
             "saveUrlSingleEntity":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}({entityId})",
             "fetchUrlMultiEntity":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}",
             "saveUrlMultiEntity":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}({entityId})",
             "requestUrlForportalLanguage": "https://{dataverseOrg}/{api}/{data}/{version}/{entity}?$select=adx_portallanguageid,adx_languagecode",
             "requestUrlForWebsiteId":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}?$select=adx_name,adx_webpageid",
             "requestUrlForWebtemplates":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}?$select=$select=adx_name,adx_webtemplateid",

             "requestUrlForWebsitelanguage":"https://{dataverseOrg}/{api}/{data}/{version}/{entity}?$select=adx_websitelanguageid,_adx_portallanguageid_value"

          }
       ],
       "entity":[
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Footer Template",
                      "_name":"adx_footerwebtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Header Template",
                      "_name":"adx_headerwebtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Language",
                      "_name":"adx_website_language",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Default Language",
                      "_name":"adx_defaultlanguage",
                      "_type":"entityreference",
                      "_lookupType":"adx_websitelanguage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Parent Website",
                      "_name":"adx_parentwebsiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Partial URL",
                      "_name":"adx_partialurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Bot Consumer",
                      "_name":"adx_defaultbotconsumerid",
                      "_type":"entityreference",
                      "_lookupType":"adx_botconsumer",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_website",
             "_displayname":"Website",
             "_etc":"10026",
             "_primaryidfield":"adx_websiteid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"website",
             "_exporttype":"SingleFolder"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Is Default",
                      "_name":"adx_isdefault",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"IsVisible",
                      "_name":"adx_isvisible",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_publishingstate",
             "_displayname":"Publishing State",
             "_etc":"10046",
             "_primaryidfield":"adx_publishingstateid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"publishingstate",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Language Code",
                      "_name":"adx_languagecode",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"System Language",
                      "_name":"adx_systemlanguage",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Portal Display Name",
                      "_name":"adx_displayname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"LCID",
                      "_name":"adx_lcid",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Portal Language",
                      "_name":"adx_portallanguageid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   }
                ]
             },
             "_name":"adx_portallanguage",
             "_displayname":"Portal Language",
             "_etc":"10032",
             "_primaryidfield":"adx_portallanguageid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_downloadThroughChild":"true",
             "_foldername":".portalconfig",
             "_propextension":"portallanguage",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_updateCompare":"true",
                      "_displayname":"Website Language",
                      "_name":"adx_websitelanguageid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Portal Language",
                      "_name":"adx_portallanguageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_portallanguage",
                      "_customfield":"true",
                      "_parentFieldName":"adx_portallanguageid"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstate",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "_name":"adx_websitelanguage",
             "_displayname":"Website Language",
             "_etc":"10046",
             "_primaryidfield":"adx_websitelanguageid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"websitelanguage",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Category",
                      "_name":"adx_category",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Comment Policy",
                      "_name":"adx_feedbackpolicy",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Copy",
                      "_name":"adx_copy",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"html",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Custom CSS",
                      "_name":"adx_customcss",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"css"
                   },
                   {
                      "_displayname":"Custom JavaScript",
                      "_name":"adx_customjavascript",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"js"
                   },
                   {
                      "_displayname":"Description",
                      "_name":"adx_meta_description",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Date",
                      "_name":"adx_displaydate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Editorial Comments",
                      "_name":"adx_editorialcomments",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Ratings",
                      "_name":"adx_enablerating",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Tracking",
                      "_name":"adx_enabletracking",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Form",
                      "_name":"adx_entityform",
                      "_type":"entityreference",
                      "_lookupType":"adx_entityform",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity List",
                      "_name":"adx_entitylist",
                      "_type":"entityreference",
                      "_lookupType":"adx_entitylist",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Exclude From Search",
                      "_name":"adx_excludefromsearch",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Expiration Date",
                      "_name":"adx_expirationdate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Hidden From Sitemap",
                      "_name":"adx_hiddenfromsitemap",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image",
                      "_name":"adx_image",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image URL",
                      "_name":"adx_imageurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Master Web Page",
                      "_name":"adx_masterwebpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Navigation",
                      "_name":"adx_navigation",
                      "_type":"entityreference",
                      "_lookupType":"adx_weblinkset",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Page Template",
                      "_name":"adx_pagetemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_pagetemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Parent Page",
                      "_name":"adx_parentpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Partial URL",
                      "_name":"adx_partialurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Release Date",
                      "_name":"adx_releasedate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Subject",
                      "_name":"adx_subjectid",
                      "_type":"entityreference",
                      "_lookupType":"subject",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Summary",
                      "_name":"adx_summary",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"html",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_title",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Form",
                      "_name":"adx_webform",
                      "_type":"entityreference",
                      "_lookupType":"adx_webform",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Page",
                      "_name":"adx_webpageid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Is Root",
                      "_name":"adx_isroot",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Is Inherited",
                      "_name":"adx_sharedpageconfiguration",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Root Webpage",
                      "_name":"adx_rootwebpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Webpage Language",
                      "_name":"adx_webpagelanguageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_websitelanguage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Bot Consumer",
                      "_name":"adx_botconsumerid",
                      "_type":"entityreference",
                      "_lookupType":"adx_botconsumer",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_webpage",
             "_displayname":"Web Page",
             "_etc":"10024",
             "_primaryidfield":"adx_webpageid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"web-pages",
             "_propextension":"webpage",
             "_exporttype":"SubFolders",
             "_languagefield":"adx_webpagelanguageid",
             "_languagegroupby":"adx_rootwebpageid",
             "_query":"?$select=adx_name,adx_webpageid"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Cloud Blob Address",
                      "_name":"adx_cloudblobaddress",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Content-Disposition",
                      "_name":"adx_contentdisposition",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Date",
                      "_name":"adx_displaydate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Tracking",
                      "_name":"adx_enabletracking",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Exclude From Search",
                      "_name":"adx_excludefromsearch",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Expiration Date",
                      "_name":"adx_expirationdate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Hidden From Sitemap",
                      "_name":"adx_hiddenfromsitemap",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Master Web File",
                      "_name":"adx_masterwebfileid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Parent Page",
                      "_name":"adx_parentpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Partial Url",
                      "_name":"adx_partialurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Release Date",
                      "_name":"adx_releasedate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Subject",
                      "_name":"adx_subjectid",
                      "_type":"entityreference",
                      "_lookupType":"subject",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Summary",
                      "_name":"adx_summary",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_title",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"File Content",
                      "_name":"adx_filecontent",
                      "_type":"file",
                      "_customfield":"true",
                      "_fileType":"base64"
                   },
                   {
                      "_displayname":"Migrated To FileContent",
                      "_name":"adx_migratedtofilecontent",
                      "_type":"bool",
                      "_customfield":"true",
                      "_skipExport":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web File",
                      "_name":"adx_webfileid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_webfile",
             "_displayname":"Web File",
             "_etc":"10020",
             "_primaryidfield":"adx_webfileid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"web-files",
             "_propextension":"webfile",
             "_exporttype":"SingleFolder"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"notetext",
                      "_type":"string"
                   },
                   {
                      "_displayname":"Document",
                      "_name":"documentbody",
                      "_type":"string",
                      "_fileType":"base64"
                   },
                   {
                      "_displayname":"File Name",
                      "_name":"filename",
                      "_type":"string"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Is Document",
                      "_name":"isdocument",
                      "_type":"bool"
                   },
                   {
                      "_displayname":"Language ID",
                      "_name":"langid",
                      "_type":"string"
                   },
                   {
                      "_displayname":"Mime Type",
                      "_name":"mimetype",
                      "_type":"string"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Note",
                      "_name":"annotationid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Object Type ",
                      "_name":"objecttypecode",
                      "_type":"string"
                   },
                   {
                      "_displayname":"Regarding",
                      "_name":"objectid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile"
                   },
                   {
                      "_displayname":"Step Id",
                      "_name":"stepid",
                      "_type":"string"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"subject",
                      "_type":"string"
                   }
                ]
             },
             "relationships":"",
             "_name":"annotation",
             "_displayname":"Note",
             "_etc":"5",
             "_primaryidfield":"annotationid",
             "_primarynamefield":"filename",
             "_disableplugins":"true",
             "_parententityname":"adx_webfile",
             "_parententityfield":"objectid",
             "_foldername":"",
             "_propextension":"",
             "_exporttype":"MergeToParent",
             "_orderby":"modifiedon desc",
             "_topcount":"1"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Copy",
                      "_name":"adx_copy",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Name",
                      "_name":"adx_display_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_title",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Link Set",
                      "_name":"adx_weblinksetid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website Language",
                      "_name":"adx_websitelanguageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_websitelanguage",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_weblinkset",
             "_displayname":"Web Link Set",
             "_etc":"10022",
             "_primaryidfield":"adx_weblinksetid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"weblink-sets",
             "_propextension":"weblinkset",
             "_exporttype":"SubFolders",
             "_languagefield":"adx_websitelanguageid",
             "_languagegroupby":"adx_name"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Disable Page Validation",
                      "_name":"adx_disablepagevalidation",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Image Only",
                      "_name":"adx_displayimageonly",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Page Child Links",
                      "_name":"adx_displaypagechildlinks",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"External URL",
                      "_name":"adx_externalurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Alt Text",
                      "_name":"adx_imagealttext",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Height",
                      "_name":"adx_imageheight",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Url",
                      "_name":"adx_imageurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Width",
                      "_name":"adx_imagewidth",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Open In New Window",
                      "_name":"adx_openinnewwindow",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Page",
                      "_name":"adx_pageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Parent Web Link",
                      "_name":"adx_parentweblinkid",
                      "_type":"entityreference",
                      "_lookupType":"adx_weblink",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Robots Follow Link",
                      "_name":"adx_robotsfollowlink",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Link",
                      "_name":"adx_weblinkid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Web Link Set",
                      "_name":"adx_weblinksetid",
                      "_type":"entityreference",
                      "_lookupType":"adx_weblinkset",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_weblink",
             "_displayname":"Web Link",
             "_etc":"10021",
             "_primaryidfield":"adx_weblinkid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_parententityname":"adx_weblinkset",
             "_parententityfield":"adx_weblinksetid",
             "_foldername":"",
             "_propextension":"weblink",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Name",
                      "_name":"adx_entityname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Is Default",
                      "_name":"adx_isdefault",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Page Template",
                      "_name":"adx_pagetemplateid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Rewrite URL",
                      "_name":"adx_rewriteurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Type",
                      "_name":"adx_type",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Use Website Header and Footer",
                      "_name":"adx_usewebsiteheaderandfooter",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Template",
                      "_name":"adx_webtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Bot Consumer",
                      "_name":"adx_botconsumerid",
                      "_type":"entityreference",
                      "_lookupType":"adx_botconsumer",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_pagetemplate",
             "_displayname":"Page Template",
             "_etc":"10017",
             "_primaryidfield":"adx_pagetemplateid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"page-templates",
             "_propextension":"pagetemplate",
             "_exporttype":"SingleFolder"
          },
          {
             "fields":{
                "field":[
                   {
                      "_updateCompare":"true",
                      "_displayname":"Content Snippet",
                      "_name":"adx_contentsnippetid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Name",
                      "_name":"adx_display_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Type",
                      "_name":"adx_type",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Value",
                      "_name":"adx_value",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"html",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Content Snippet Language",
                      "_name":"adx_contentsnippetlanguageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_websitelanguage",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_contentsnippet",
             "_displayname":"Content Snippet",
             "_etc":"10016",
             "_primaryidfield":"adx_contentsnippetid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"content-snippets",
             "_propextension":"contentsnippet",
             "_exporttype":"SubFolders",
             "_languagefield":"adx_contentsnippetlanguageid",
             "_languagegroupby":"adx_name"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"MIME Type",
                      "_name":"adx_mimetype",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Source",
                      "_name":"adx_source",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"html"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Template",
                      "_name":"adx_webtemplateid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_webtemplate",
             "_displayname":"Web Template",
             "_etc":"10060",
             "_primaryidfield":"adx_webtemplateid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"web-templates",
             "_propextension":"webtemplate",
             "_exporttype":"SubFolders",
             "_query":"?$select=adx_name,adx_webtemplateid"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Site Setting",
                      "_name":"adx_sitesettingid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Value",
                      "_name":"adx_value",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_sitesetting",
             "_displayname":"Site Setting",
             "_etc":"10019",
             "_primaryidfield":"adx_sitesettingid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"sitesetting",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Right",
                      "_name":"adx_right",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Scope",
                      "_name":"adx_scope",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Page",
                      "_name":"adx_webpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Page Access Control Rule",
                      "_name":"adx_webpageaccesscontrolruleid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_webpageaccesscontrolrule_webrole",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_webpageaccesscontrolrule_webrole",
                   "_m2mTargetEntity":"adx_webrole",
                   "_m2mTargetEntityPrimaryKey":"adx_webroleid"
                }
             },
             "_name":"adx_webpageaccesscontrolrule",
             "_displayname":"Web Page Access Control Rule",
             "_etc":"10054",
             "_primaryidfield":"adx_webpageaccesscontrolruleid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"webpagerule",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Anonymous Users Role",
                      "_name":"adx_anonymoususersrole",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Authenticated Users Role",
                      "_name":"adx_authenticatedusersrole",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Role",
                      "_name":"adx_webroleid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Key",
                      "_name":"adx_key",
                      "_type":"string",
                      "_customfield":"true"
                   }
                ]
             },
             "_name":"adx_webrole",
             "_displayname":"Web Role",
             "_etc":"10025",
             "_primaryidfield":"adx_webroleid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"webrole",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Manage Content Snippets",
                      "_name":"adx_managecontentsnippets",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Manage Site Markers",
                      "_name":"adx_managesitemarkers",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Manage Web Link Sets",
                      "_name":"adx_manageweblinksets",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Preview Unpublished Entities",
                      "_name":"adx_previewunpublishedentities",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Website Access",
                      "_name":"adx_websiteaccessid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_websiteaccess_webrole",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_websiteaccess_webrole",
                   "_m2mTargetEntity":"adx_webrole",
                   "_m2mTargetEntityPrimaryKey":"adx_webroleid"
                }
             },
             "_name":"adx_websiteaccess",
             "_displayname":"Website Access",
             "_etc":"10058",
             "_primaryidfield":"adx_websiteaccessid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"websiteaccess",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Page",
                      "_name":"adx_pageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Site Marker",
                      "_name":"adx_sitemarkerid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_sitemarker",
             "_displayname":"Site Marker",
             "_etc":"10018",
             "_primaryidfield":"adx_sitemarkerid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"sitemarker",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Tag",
                      "_name":"adx_tagid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_tag",
             "_displayname":"Tag",
             "_etc":"10051",
             "_primaryidfield":"adx_tagid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"tag",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Address Line Field Name",
                      "_name":"adx_geolocation_addresslinefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Allow Create If Null",
                      "_name":"adx_recordsourceallowcreateonnull",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Append Entity ID To Query String",
                      "_name":"adx_redirecturlappendentityidquerystring",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Append Query String",
                      "_name":"adx_appendquerystring",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Associate Current Portal User",
                      "_name":"adx_associatecurrentportaluser",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File",
                      "_name":"adx_attachfile",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Accept",
                      "_name":"adx_attachfileaccept",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Allow Multiple",
                      "_name":"adx_attachfileallowmultiple",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Extension Type Accept",
                      "_name":"adx_attachfileacceptextensions",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Save Option",
                      "_name":"adx_attachfilesaveoption",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Label",
                      "_name":"adx_attachfilelabel",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Attach File Required",
                      "_name":"adx_attachfilerequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Required Error Message",
                      "_name":"adx_attachfilerequirederrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Attach File Size Error Message",
                      "_name":"adx_attachfilesizeerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Attach File Storage Location",
                      "_name":"adx_attachfilestoragelocation",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Type Error Message",
                      "_name":"adx_attachfiletypeerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Attribute Logical Name",
                      "_name":"adx_redirecturlquerystringattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Auto Generate Steps From Tabs",
                      "_name":"adx_autogeneratesteps",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Captcha Required",
                      "_name":"adx_captcharequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"City Field Name",
                      "_name":"adx_geolocation_cityfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Country/Region Field Name",
                      "_name":"adx_geolocation_countryfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"County Field Name",
                      "_name":"adx_geolocation_countyfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Custom JavaScript",
                      "_name":"adx_registerstartupscript",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"js"
                   },
                   {
                      "_displayname":"Custom Query String",
                      "_name":"adx_redirecturlcustomquerystring",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Map",
                      "_name":"adx_geolocation_displaymap",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Entity Permissions",
                      "_name":"adx_entitypermissionsenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Validation Summary Links",
                      "_name":"adx_validationsummarylinksenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enabled",
                      "_name":"adx_geolocation_enabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Entity Form",
                      "_name":"adx_entityformid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Entity Name",
                      "_name":"adx_entityname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Source Type",
                      "_name":"adx_entitysourcetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Form Name",
                      "_name":"adx_formname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Formatted Address Field Name",
                      "_name":"adx_geolocation_formattedaddressfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Hide Form on Success",
                      "_name":"adx_hideformonsuccess",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Instructions",
                      "_name":"adx_instructions",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Is Activity Party",
                      "_name":"adx_portaluserlookupattributeisactivityparty",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Latitude Field Name",
                      "_name":"adx_geolocation_latitudefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Longitude Field Name",
                      "_name":"adx_geolocation_longitudefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Make All Fields Required",
                      "_name":"adx_forceallfieldsrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Map Type",
                      "_name":"adx_geolocation_maptype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Maximum File Size",
                      "_name":"adx_attachfilemaxsize",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Mode",
                      "_name":"adx_mode",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Neighborhood Field Name",
                      "_name":"adx_geolocation_neighborhoodfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Next Button CSS Class",
                      "_name":"adx_nextbuttoncssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Next Button Text",
                      "_name":"adx_nextbuttontext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"On Success",
                      "_name":"adx_onsuccess",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Populate Entity Reference Lookup Field",
                      "_name":"adx_populatereferenceentitylookupfield",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Previous Button CSS Class",
                      "_name":"adx_previousbuttoncssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Previous Button Text",
                      "_name":"adx_previousbuttontext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Primary Key Name",
                      "_name":"adx_primarykeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Query String Parameter Name",
                      "_name":"adx_redirecturlquerystringattributeparamname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Recommended Fields Required",
                      "_name":"adx_recommendedfieldsrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record ID Query String Parameter Name",
                      "_name":"adx_recordidquerystringparametername",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Not Found Message",
                      "_name":"adx_recordnotfoundmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Record Source Entity Logical Name",
                      "_name":"adx_recordsourceentitylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Source Relationship Name",
                      "_name":"adx_referencerecordsourcerelationshipname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect URL",
                      "_name":"adx_redirecturl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect URL Query String Name",
                      "_name":"adx_redirecturlquerystringname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect Web Page",
                      "_name":"adx_redirectwebpage",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Logical Name",
                      "_name":"adx_referenceentitylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Primary Key Logical Name",
                      "_name":"adx_referenceentityprimarykeylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity ReadOnly Form Name",
                      "_name":"adx_referenceentityreadonlyformname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Relationship Name",
                      "_name":"adx_referenceentityrelationshipname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Source Type",
                      "_name":"adx_referenceentitysourcetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Query Attribute Logical Name",
                      "_name":"adx_referencequeryattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Query String Is Primary Key",
                      "_name":"adx_referencequerystringisprimarykey",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Query String Name",
                      "_name":"adx_referencequerystringname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Target Lookup Attribute Logical Name",
                      "_name":"adx_referencetargetlookupattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Relationship Name",
                      "_name":"adx_recordsourcerelationshipname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Render Web Resources Inline",
                      "_name":"adx_renderwebresourcesinline",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Restrict Files To Accepted Types",
                      "_name":"adx_attachfilerestrictaccept",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Set Entity Reference",
                      "_name":"adx_setentityreference",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Settings",
                      "_name":"adx_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Show Captcha for Authenticated Users",
                      "_name":"adx_showcaptchaforauthenticatedusers",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Show Owner Fields",
                      "_name":"adx_showownerfields",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Show Reference Entity ReadOnly Form",
                      "_name":"adx_referenceentityshowreadonlyform",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Show Unsupported Fields",
                      "_name":"adx_showunsupportedfields",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"State or Province Field Name",
                      "_name":"adx_geolocation_statefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Submit Button Busy Text",
                      "_name":"adx_submitbuttonbusytext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Submit Button CSS Class",
                      "_name":"adx_submitbuttoncssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Submit Button Text",
                      "_name":"adx_submitbuttontext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Success Message",
                      "_name":"adx_successmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Tab Name",
                      "_name":"adx_tabname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Portal User Lookup Attribute",
                      "_name":"adx_targetentityportaluserlookupattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"ToolTip Enabled",
                      "_name":"adx_tooltipenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Validation Group",
                      "_name":"adx_validationgroup",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Validation Summary CSS Class",
                      "_name":"adx_validationsummarycssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Validation Summary Header Text",
                      "_name":"adx_validationsummaryheadertext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Validation Summary Link Text",
                      "_name":"adx_validationsummarylinktext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Zip/Postal Code Field Name",
                      "_name":"adx_geolocation_postalcodefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_entityform",
             "_displayname":"Basic Form",
             "_etc":"10077",
             "_primaryidfield":"adx_entityformid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"basic-forms",
             "_propextension":"basicform",
             "_exporttype":"SubFolders"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Add Description",
                      "_name":"adx_adddescription",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attribute Logical Name",
                      "_name":"adx_attributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Constant Sum Maximum Total",
                      "_name":"adx_constantsummaximumtotal",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Constant Sum Minimum Total",
                      "_name":"adx_constantsumminimumtotal",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Constant Sum Validation Error Message",
                      "_name":"adx_constantsumvalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Control Style",
                      "_name":"adx_controlstyle",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"CSS Class",
                      "_name":"adx_cssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Entity Form",
                      "_name":"adx_entityform",
                      "_type":"entityreference",
                      "_lookupType":"adx_entityform",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Entity Form Metadata",
                      "_name":"adx_entityformmetadataid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Field is Required",
                      "_name":"adx_fieldisrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Geolocation Validator Error Message",
                      "_name":"adx_geolocationvalidatorerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Group Name",
                      "_name":"adx_groupname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Ignore Default Value",
                      "_name":"adx_ignoredefaultvalue",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Label",
                      "_name":"adx_label",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Mulitple Choice Minimum Required Selected Count",
                      "_name":"adx_minmultiplechoiceselectedcount",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Multiple Choice Max Selected Count",
                      "_name":"adx_maxmultiplechoiceselectedcount",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Multiple Choice Validation Error Message",
                      "_name":"adx_multiplechoicevalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Notes Settings",
                      "_name":"adx_notes_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"On Save From Attribute",
                      "_name":"adx_onsavefromattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"On Save Type",
                      "_name":"adx_onsavetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Position",
                      "_name":"adx_descriptionposition",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepopulate From Attribute",
                      "_name":"adx_prepopulatefromattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepopulate Type",
                      "_name":"adx_prepopulatetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepopulate Value",
                      "_name":"adx_prepopulatevalue",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Randomize Option Set Values",
                      "_name":"adx_randomizeoptionsetvalues",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Range Validation Error Message",
                      "_name":"adx_rangevalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Rank Order No Ties Validation Error Message",
                      "_name":"adx_rankordernotiesvalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Regular Expression Validation Error Message",
                      "_name":"adx_validationregularexpressionerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Required Field Validation Error Message",
                      "_name":"adx_requiredfieldvalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Section Name",
                      "_name":"adx_sectionname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Set Value On Save",
                      "_name":"adx_setvalueonsave",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Subgrid Name",
                      "_name":"adx_subgrid_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Subgrid Settings",
                      "_name":"adx_subgrid_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Tab Name",
                      "_name":"adx_tabname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Type",
                      "_name":"adx_type",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Use Attribute's Description Property",
                      "_name":"adx_useattributedescriptionproperty",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Validation Error Message",
                      "_name":"adx_validationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Validation Regular Expression",
                      "_name":"adx_validationregularexpression",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Value",
                      "_name":"adx_onsavevalue",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Form for Create",
                      "_name":"adx_entityformforcreate",
                      "_type":"entityreference",
                      "_lookupType":"adx_entityform",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_entityformmetadata",
             "_displayname":"Basic Form Metadata",
             "_etc":"10078",
             "_primaryidfield":"adx_entityformmetadataid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_parententityname":"adx_entityform",
             "_parententityfield":"adx_entityform",
             "_foldername":"",
             "_propextension":"basicformmetadata",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Apply Button Label",
                      "_name":"adx_filter_applybuttonlabel",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Calendar Initial Date",
                      "_name":"adx_calendar_initialdate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Calendar Initial View",
                      "_name":"adx_calendar_initialview",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Calendar Style",
                      "_name":"adx_calendar_style",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Calendar View Enabled",
                      "_name":"adx_calendar_enabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Create Button Label",
                      "_name":"adx_createbuttonlabel",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Credentials",
                      "_name":"adx_map_credentials",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Custom Javascript",
                      "_name":"adx_registerstartupscript",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"js"
                   },
                   {
                      "_displayname":"Description Field Name",
                      "_name":"adx_calendar_descriptionfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Details Button Label",
                      "_name":"adx_detailsbuttonlabel",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Display Time Zone",
                      "_name":"adx_calendar_timezone",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Distance Units",
                      "_name":"adx_map_distanceunits",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Distance Values",
                      "_name":"adx_map_distancevalues",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Empty List Text",
                      "_name":"adx_emptylisttext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Enable Entity Permissions",
                      "_name":"adx_entitypermissionsenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"End Date Field Name",
                      "_name":"adx_calendar_enddatefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Entity List",
                      "_name":"adx_entitylistid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Entity Name",
                      "_name":"adx_entityname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Filter Account Attribute",
                      "_name":"adx_filteraccount",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Filter Definition",
                      "_name":"adx_filter_definition",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Filter Enabled",
                      "_name":"adx_filter_enabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Filter Orientation",
                      "_name":"adx_filter_orientation",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Filter Portal User Attribute",
                      "_name":"adx_filterportaluser",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Filter Website Attribute",
                      "_name":"adx_filterwebsite",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"ID Query String Parameter Name",
                      "_name":"adx_idquerystringparametername",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Infobox Description Field Name",
                      "_name":"adx_map_infoboxdescriptionfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Infobox Offset x",
                      "_name":"adx_map_infoboxoffsetx",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Infobox Offset y",
                      "_name":"adx_map_infoboxoffsety",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Infobox Title Field Name",
                      "_name":"adx_map_infoboxtitlefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Is All Day Field Name",
                      "_name":"adx_calendar_alldayfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Key",
                      "_name":"adx_key",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Latitude",
                      "_name":"adx_map_latitude",
                      "_type":"float",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Latitude Field Name",
                      "_name":"adx_map_latitudefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Location Field Name",
                      "_name":"adx_calendar_locationfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Longitude",
                      "_name":"adx_map_longitude",
                      "_type":"float",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Longitude Field Name",
                      "_name":"adx_map_longitudefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Map Enabled",
                      "_name":"adx_map_enabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Map Type",
                      "_name":"adx_map_type",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"OData Enabled",
                      "_name":"adx_odata_enabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"OData Entity Set Name",
                      "_name":"adx_odata_entitysetname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"OData Entity Type Name",
                      "_name":"adx_odata_entitytypename",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"OData View",
                      "_name":"adx_odata_view",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Organizer Field Name",
                      "_name":"adx_calendar_organizerfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Page Size",
                      "_name":"adx_pagesize",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Pin Image Height",
                      "_name":"adx_map_pushpinheight",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Pin Image URL",
                      "_name":"adx_map_pushpinurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Pin Image Width",
                      "_name":"adx_map_pushpinwidth",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Primary Key Name",
                      "_name":"adx_primarykeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"REST URL",
                      "_name":"adx_map_resturl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Search Enabled",
                      "_name":"adx_searchenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Search Placeholder Text",
                      "_name":"adx_searchplaceholdertext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Search Tooltip Text",
                      "_name":"adx_searchtooltiptext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Settings",
                      "_name":"adx_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Start Date Field Name",
                      "_name":"adx_calendar_startdatefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Summary Field Name",
                      "_name":"adx_calendar_summaryfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Display Mode",
                      "_name":"adx_calendar_timezonemode",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"View",
                      "_name":"adx_view",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Views",
                      "_name":"adx_views",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Web Page for Create",
                      "_name":"adx_webpageforcreate",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Web Page for Details View",
                      "_name":"adx_webpagefordetailsview",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Zoom",
                      "_name":"adx_map_zoom",
                      "_type":"number",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_entitylist",
             "_displayname":"List",
             "_etc":"10079",
             "_primaryidfield":"adx_entitylistid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"lists",
             "_propextension":"list",
             "_exporttype":"SingleFolder"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Account Relationship",
                      "_name":"adx_accountrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Append",
                      "_name":"adx_append",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Append To",
                      "_name":"adx_appendto",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Contact Relationship",
                      "_name":"adx_contactrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Create",
                      "_name":"adx_create",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Delete",
                      "_name":"adx_delete",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Name",
                      "_name":"adx_entitylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Entity Permission",
                      "_name":"adx_entitypermissionid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_entityname",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Parent Entity Permission",
                      "_name":"adx_parententitypermission",
                      "_type":"entityreference",
                      "_lookupType":"adx_entitypermission",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Parent Relationship",
                      "_name":"adx_parentrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Read",
                      "_name":"adx_read",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Scope",
                      "_name":"adx_scope",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Write",
                      "_name":"adx_write",
                      "_type":"bool",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_entitypermission_webrole",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_entitypermission_webrole",
                   "_m2mTargetEntity":"adx_webrole",
                   "_m2mTargetEntityPrimaryKey":"adx_webroleid"
                }
             },
             "_name":"adx_entitypermission",
             "_displayname":"Table Permission",
             "_etc":"10033",
             "_primaryidfield":"adx_entitypermissionid",
             "_primarynamefield":"adx_entityname",
             "_disableplugins":"true",
             "_foldername":"table-permissions",
             "_propextension":"tablepermission",
             "_exporttype":"SingleFolder"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Authentication Required",
                      "_name":"adx_authenticationrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Save Changes Warning On Close",
                      "_name":"adx_savechangeswarningonclose",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Existing Record Permitted",
                      "_name":"adx_editexistingrecordpermitted",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Expired Message",
                      "_name":"adx_editexpiredmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Edit Expired State Code",
                      "_name":"adx_editexpiredstatecode",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Expired Status Code",
                      "_name":"adx_editexpiredstatuscode",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Not Permitted Message",
                      "_name":"adx_editnotpermittedmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Enabled",
                      "_name":"adx_progressindicatorenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Ignore Last Step In Progress Count",
                      "_name":"adx_progressindicatorignorelaststep",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Multiple Records Per User Permitted",
                      "_name":"adx_multiplerecordsperuserpermitted",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Position",
                      "_name":"adx_progressindicatorposition",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepend Step Number to Step Title",
                      "_name":"adx_progressindicatorprependstepnum",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Save Changes Warning Message",
                      "_name":"adx_savechangeswarningmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Start New Session On Load",
                      "_name":"adx_startnewsessiononload",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Start Step",
                      "_name":"adx_startstep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Type",
                      "_name":"adx_progressindicatortype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Form",
                      "_name":"adx_webformid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_webform",
             "_displayname":"Advanced Form",
             "_etc":"10080",
             "_primaryidfield":"adx_webformid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"advanced-forms",
             "_propextension":"advancedform",
             "_exporttype":"SubFolders"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Accept",
                      "_name":"adx_accept",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Address Line Field Name",
                      "_name":"adx_geolocation_addresslinefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Allow Multiple Files",
                      "_name":"adx_allowmultiplefiles",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Append Entity ID To Query String",
                      "_name":"adx_redirecturlappendentityidquerystring",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Append Query String",
                      "_name":"adx_appendquerystring",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Associate Current Portal User",
                      "_name":"adx_associatecurrentportaluser",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File",
                      "_name":"adx_attachfile",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Label",
                      "_name":"adx_attachfilelabel",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Attach File Maximum Size",
                      "_name":"adx_attachfilemaxsize",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Required",
                      "_name":"adx_attachfilerequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Required Error Message",
                      "_name":"adx_attachfilerequirederrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Attach File Restrict Accept",
                      "_name":"adx_attachfilerestrictaccept",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Size Error Message",
                      "_name":"adx_attachfilesizeerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Attach File Storage Location",
                      "_name":"adx_attachfilestoragelocation",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attach File Type Error Message",
                      "_name":"adx_attachfiletypeerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Attribute Logical Name",
                      "_name":"adx_redirecturlquerystringattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Auto Generate Steps From Tabs",
                      "_name":"adx_autogeneratesteps",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Auto Number Attribute Logical Name",
                      "_name":"adx_autonumberattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Auto Number Definition Name",
                      "_name":"adx_autonumberdefinitionname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Captcha Required",
                      "_name":"adx_captcharequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"City Field Name",
                      "_name":"adx_geolocation_cityfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Condition",
                      "_name":"adx_condition",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Condition Default Next Step",
                      "_name":"adx_conditiondefaultnextstep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Country/Region Field Name",
                      "_name":"adx_geolocation_countryfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"County Field Name",
                      "_name":"adx_geolocation_countyfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Create Auto Number",
                      "_name":"adx_createautonumber",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Custom JavaScript",
                      "_name":"adx_registerstartupscript",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"js"
                   },
                   {
                      "_displayname":"Custom Query String",
                      "_name":"adx_redirecturlcustomquerystring",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Map",
                      "_name":"adx_geolocation_displaymap",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Existing Record Permitted",
                      "_name":"adx_editexistingrecordpermitted",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Expired Message",
                      "_name":"adx_editexpiredmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Edit Expired State Code",
                      "_name":"adx_editexpiredstatecode",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Expired Status Reason",
                      "_name":"adx_editexpiredstatusreason",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Edit Not Permitted Message",
                      "_name":"adx_editnotpermittedmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Enable Entity Permissions",
                      "_name":"adx_entitypermissionsenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Validation Summary Links",
                      "_name":"adx_validationsummarylinksenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enabled",
                      "_name":"adx_geolocation_enabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Source Step",
                      "_name":"adx_entitysourcestep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Entity Source Type",
                      "_name":"adx_entitysourcetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Form Name",
                      "_name":"adx_formname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Formatted Address Field Name",
                      "_name":"adx_geolocation_formattedaddressfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Hide Form on Success",
                      "_name":"adx_hideformonsuccess",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Instructions",
                      "_name":"adx_instructions",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Is Activity Party",
                      "_name":"adx_portaluserlookupattributeisactivityparty",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Latitude Field Name",
                      "_name":"adx_geolocation_latitudefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Load Event Key Name",
                      "_name":"adx_loadeventkeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Log User",
                      "_name":"adx_loguser",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Longitude Field Name",
                      "_name":"adx_geolocation_longitudefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Make All Fields Required",
                      "_name":"adx_forceallfieldsrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Map Type",
                      "_name":"adx_geolocation_maptype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Mode",
                      "_name":"adx_mode",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Move Previous Event Key Name",
                      "_name":"adx_movepreviouseventkeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Move Previous Permitted",
                      "_name":"adx_movepreviouspermitted",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Multiple Records Per User Permitted",
                      "_name":"adx_multiplerecordsperuserpermitted",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Neighborhood Field Name",
                      "_name":"adx_geolocation_neighborhoodfieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Next Button CSS Class",
                      "_name":"adx_nextbuttoncssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Next Button Text",
                      "_name":"adx_nextbuttontext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Next Step",
                      "_name":"adx_nextstep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Populate Entity Reference Lookup Field",
                      "_name":"adx_populatereferenceentitylookupfield",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Post Back URL",
                      "_name":"adx_postbackurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Previous Button CSS Class",
                      "_name":"adx_previousbuttoncssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Previous Button Text",
                      "_name":"adx_previousbuttontext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Previous Step",
                      "_name":"adx_previousstep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Primary Key Attribute Logical Name",
                      "_name":"adx_primarykeyattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Primary Key Query String Parameter Name",
                      "_name":"adx_primarykeyquerystringparametername",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Query String Parameter Name",
                      "_name":"adx_redirecturlquerystringattributeparamname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Recommended Fields Required",
                      "_name":"adx_recommendedfieldsrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Not Found Message",
                      "_name":"adx_recordnotfoundmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Record Source Relationship Name",
                      "_name":"adx_referencerecordsourcerelationshipname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect URL",
                      "_name":"adx_redirecturl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect URL Query String Name",
                      "_name":"adx_redirecturlquerystringname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect Web Page",
                      "_name":"adx_redirectwebpage",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Logical Name",
                      "_name":"adx_referenceentitylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Primary Key Logical Name",
                      "_name":"adx_referenceentityprimarykeylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity ReadOnly Form Name",
                      "_name":"adx_referenceentityreadonlyformname",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Reference Entity Relationship Name",
                      "_name":"adx_referenceentityrelationshipname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Source Type",
                      "_name":"adx_referenceentitysourcetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Entity Step",
                      "_name":"adx_referenceentitystep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Query Attribute Logical Name",
                      "_name":"adx_referencequeryattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Query String Is Primary Key",
                      "_name":"adx_referencequerystringisprimarykey",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Query String Name",
                      "_name":"adx_referencequerystringname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Source Entity Logical Name",
                      "_name":"adx_referencesourceentitylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Reference Target Lookup Attribute Logical Name",
                      "_name":"adx_referencetargetlookupattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Relationship Name",
                      "_name":"adx_recordsourcerelationshipname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Render Web Resources Inline",
                      "_name":"adx_renderwebresourcesinline",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Saved Event Key Name",
                      "_name":"adx_savedeventkeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Saving Event Key Name",
                      "_name":"adx_savingeventkeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Set Entity Reference",
                      "_name":"adx_setentityreference",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Settings",
                      "_name":"adx_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Show Captcha for authenticated users",
                      "_name":"adx_showcaptchaforauthenticatedusers",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Show Owner Fields",
                      "_name":"adx_showownerfields",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Show Reference Entity ReadOnly Form",
                      "_name":"adx_referenceentityshowreadonlyform",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Show Unsupported Fields",
                      "_name":"adx_showunsupportedfields",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"State or Province Field Name",
                      "_name":"adx_geolocation_statefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Submit Button Busy Text",
                      "_name":"adx_submitbuttonbusytext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Submit Button CSS Class",
                      "_name":"adx_submitbuttoncssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Submit Button Text",
                      "_name":"adx_submitbuttontext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Submit Event Key Name",
                      "_name":"adx_submiteventkeyname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Success Message",
                      "_name":"adx_successmessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Tab Name",
                      "_name":"adx_tabname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Logical Name",
                      "_name":"adx_targetentitylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Portal User Lookup Attribute",
                      "_name":"adx_targetentityportaluserlookupattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Primary Key Logical Name",
                      "_name":"adx_targetentityprimarykeylogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_title",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"ToolTip Enabled",
                      "_name":"adx_tooltipenabled",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Type",
                      "_name":"adx_type",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"User Control Path",
                      "_name":"adx_usercontrolpath",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"User Control Title",
                      "_name":"adx_usercontroltitle",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"User Host Address Attribute Logical Name",
                      "_name":"adx_userhostaddressattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"User Identity Name Attribute Logical Name",
                      "_name":"adx_useridentitynameattributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Validation Group",
                      "_name":"adx_validationgroup",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Validation Summary CSS Class",
                      "_name":"adx_validationsummarycssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Validation Summary Header Text",
                      "_name":"adx_validationsummaryheadertext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Validation Summary Link Text",
                      "_name":"adx_validationsummarylinktext",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Web Form",
                      "_name":"adx_webform",
                      "_type":"entityreference",
                      "_lookupType":"adx_webform",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Form Step",
                      "_name":"adx_webformstepid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Zip/Postal Code Field Name",
                      "_name":"adx_geolocation_postalcodefieldname",
                      "_type":"string",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_webformstep",
             "_displayname":"Advanced Form Step",
             "_etc":"10083",
             "_primaryidfield":"adx_webformstepid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_parententityname":"adx_webform",
             "_parententityfield":"adx_webform",
             "_foldername":"advanced-form-steps",
             "_propextension":"advancedformstep",
             "_exporttype":"SubFolders"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Add Description",
                      "_name":"adx_adddescription",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Attribute Logical Name",
                      "_name":"adx_attributelogicalname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Constant Sum Maximum Total",
                      "_name":"adx_constantsummaximumtotal",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Constant Sum Minimum Total",
                      "_name":"adx_constantsumminimumtotal",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Constant Sum Validation Error Message",
                      "_name":"adx_constantsumvalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Control Style",
                      "_name":"adx_controlstyle",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Create Invoice on Payment",
                      "_name":"adx_purchasecreateinvoiceonpayment",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"CSS Class",
                      "_name":"adx_cssclass",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Field is Required",
                      "_name":"adx_fieldisrequired",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Fulfill Order on Payment",
                      "_name":"adx_purchasefulfillorderonpayment",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Geolocation Validator Error Message",
                      "_name":"adx_geolocationvalidatorerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Group Name",
                      "_name":"adx_groupname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Ignore Default Value",
                      "_name":"adx_ignoredefaultvalue",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Label",
                      "_name":"adx_label",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Line Item Description Attribute Name",
                      "_name":"adx_purchaselineitemdescriptionattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item Instructions Attribute Name",
                      "_name":"adx_purchaselineiteminstructionsattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item Order Attribute Name",
                      "_name":"adx_purchaselineitemorderattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item Product Attribute Name",
                      "_name":"adx_purchaselineitemproductattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item Quantity Attribute Name",
                      "_name":"adx_purchaselineitemquantityattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item Relationship Name",
                      "_name":"adx_purchaselineitemrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item Required Attribute Name",
                      "_name":"adx_purchaselineitemrequiredattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Line Item UoM Attribute Name",
                      "_name":"adx_purchaselineitemuomattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Mulitple Choice Minimum Required Selected Count",
                      "_name":"adx_minmultiplechoiceselectedcount",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Multiple Choice Max Selected Count",
                      "_name":"adx_maxmultiplechoiceselectedcount",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Multiple Choice Validation Error Message",
                      "_name":"adx_multiplechoicevalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Notes Settings",
                      "_name":"adx_notes_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"On Save From Attribute",
                      "_name":"adx_onsavefromattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"On Save Type",
                      "_name":"adx_onsavetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Optional Products Relationship Name",
                      "_name":"adx_purchaseoptionalproductsrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Position",
                      "_name":"adx_descriptionposition",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepopulate From Attribute",
                      "_name":"adx_prepopulatefromattribute",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepopulate Type",
                      "_name":"adx_prepopulatetype",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Prepopulate Value",
                      "_name":"adx_prepopulatevalue",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Quote Name",
                      "_name":"adx_purchasequotename",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Randomize Option Set Values",
                      "_name":"adx_randomizeoptionsetvalues",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Range Validation Error Message",
                      "_name":"adx_rangevalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Rank Order No Ties Validation Error Message",
                      "_name":"adx_rankordernotiesvalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Regular Expression Validation Error Message",
                      "_name":"adx_validationregularexpressionerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Required Field Validation Error Message",
                      "_name":"adx_requiredfieldvalidationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Required Products Relationship Name",
                      "_name":"adx_purchaserequiredproductsrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Requires Shipping",
                      "_name":"adx_purchaserequiresshipping",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Section Name",
                      "_name":"adx_sectionname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Set Value On Save",
                      "_name":"adx_setvalueonsave",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Subgrid Name",
                      "_name":"adx_subgrid_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Subgrid Settings",
                      "_name":"adx_subgrid_settings",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Tab Name",
                      "_name":"adx_tabname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Invoice Relationship Name",
                      "_name":"adx_purchasetargetentityinvoicerelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Order Relationship Name",
                      "_name":"adx_purchasetargetentityorderrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Target Entity Relationship Name",
                      "_name":"adx_purchasetargetentityrelationship",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Type",
                      "_name":"adx_type",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Use Attribute's Description Property",
                      "_name":"adx_useattributedescriptionproperty",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Validation Error Message",
                      "_name":"adx_validationerrormessage",
                      "_type":"string",
                      "_customfield":"true",
                      "_fileType":"InlineJSON",
                      "_localize":"true"
                   },
                   {
                      "_displayname":"Validation Regular Expression",
                      "_name":"adx_validationregularexpression",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Value",
                      "_name":"adx_onsavevalue",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Web Form Metadata",
                      "_name":"adx_webformmetadataid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Web Form Step",
                      "_name":"adx_webformstep",
                      "_type":"entityreference",
                      "_lookupType":"adx_webformstep",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Basic Form for Create",
                      "_name":"adx_entityformforcreate",
                      "_type":"entityreference",
                      "_lookupType":"adx_entityform",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_webformmetadata",
             "_displayname":"Advanced Form Metadata",
             "_etc":"10081",
             "_primaryidfield":"adx_webformmetadataid",
             "_primarynamefield":"adx_attributelogicalname",
             "_disableplugins":"true",
             "_parententityname":"adx_webformstep",
             "_parententityfield":"adx_webformstep",
             "_foldername":"",
             "_propextension":"advancedformmetadata",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Active",
                      "_name":"adx_active",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Close Voting Date",
                      "_name":"adx_closevotingdate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Expiration Date",
                      "_name":"adx_expirationdate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Poll",
                      "_name":"adx_pollid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Question",
                      "_name":"adx_question",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Release Date",
                      "_name":"adx_releasedate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Submit Button Label",
                      "_name":"adx_submitbuttonlabel",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Template",
                      "_name":"adx_webtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_poll",
             "_displayname":"Poll",
             "_etc":"10042",
             "_primaryidfield":"adx_pollid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"polls",
             "_propextension":"poll",
             "_exporttype":"SubFolders"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Poll",
                      "_name":"adx_pollid",
                      "_type":"entityreference",
                      "_lookupType":"adx_poll",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Poll Option",
                      "_name":"adx_polloptionid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Response",
                      "_name":"adx_answer",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Votes",
                      "_name":"adx_votes",
                      "_type":"number",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_polloption",
             "_displayname":"Poll Option",
             "_etc":"10043",
             "_primaryidfield":"adx_polloptionid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_parententityname":"adx_poll",
             "_parententityfield":"adx_pollid",
             "_foldername":"",
             "_propextension":"polloption",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Poll Placement",
                      "_name":"adx_pollplacementid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Template",
                      "_name":"adx_webtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_pollplacement_poll",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_pollplacement_poll",
                   "_m2mTargetEntity":"adx_poll",
                   "_m2mTargetEntityPrimaryKey":"adx_pollid"
                }
             },
             "_name":"adx_pollplacement",
             "_displayname":"Poll Placement",
             "_etc":"10044",
             "_primaryidfield":"adx_pollplacementid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"poll-placements",
             "_propextension":"pollplacement",
             "_exporttype":"SingleFolder"
          },
          {
             "fields":{
                "field":[
                   {
                      "_updateCompare":"true",
                      "_displayname":"Website Binding",
                      "_name":"adx_websitebindingid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Site Name",
                      "_name":"adx_sitename",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Virtual Path",
                      "_name":"adx_virtualpath",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "_name":"adx_websitebinding",
             "_displayname":"Website Binding",
             "_etc":"20046",
             "_primaryidfield":"adx_websitebindingid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":".portalconfig",
             "_propextension":"websitebinding",
             "_exporttype":"SingleFile",
             "_syncdirection":"ExportOnly"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Inbound URL",
                      "_name":"adx_inboundurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Created On",
                      "_name":"overriddencreatedon",
                      "_type":"datetime"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Redirect",
                      "_name":"adx_redirectid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Redirect URL",
                      "_name":"adx_redirecturl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Site Marker",
                      "_name":"adx_sitemarkerid",
                      "_type":"entityreference",
                      "_lookupType":"adx_sitemarker",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Code",
                      "_name":"adx_statuscode",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Page",
                      "_name":"adx_webpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_redirect",
             "_displayname":"Redirect",
             "_etc":"10039",
             "_primaryidfield":"adx_redirectid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"redirect",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Disable Shortcut Target Validation",
                      "_name":"adx_disabletargetvalidation",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"External URL",
                      "_name":"adx_externalurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Parent Page",
                      "_name":"adx_parentpage_webpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Created On",
                      "_name":"overriddencreatedon",
                      "_type":"datetime"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Shortcut",
                      "_name":"adx_shortcutid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_title",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web File",
                      "_name":"adx_webfileid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Web Page",
                      "_name":"adx_webpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_shortcut",
             "_displayname":"Shortcut",
             "_etc":"10041",
             "_primaryidfield":"adx_shortcutid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"shortcut",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Changed Date",
                      "_name":"adx_changeddate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Created On",
                      "_name":"overriddencreatedon",
                      "_type":"datetime"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Shows the URL history.",
                      "_name":"adx_urlhistoryid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web File",
                      "_name":"adx_webfileid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Web Page",
                      "_name":"adx_webpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_urlhistory",
             "_displayname":"URL History",
             "_etc":"10043",
             "_primaryidfield":"adx_urlhistoryid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"urlhistory",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_updateCompare":"true",
                      "_displayname":"Ad",
                      "_name":"adx_adid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Copy",
                      "_name":"adx_copy",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Expiration Date",
                      "_name":"adx_expirationdate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Alt Text",
                      "_name":"adx_imagealttext",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Height",
                      "_name":"adx_imageheight",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"image URL",
                      "_name":"adx_image",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Image Width",
                      "_name":"adx_imagewidth",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Open In New Window",
                      "_name":"adx_openinnewwindow",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Record Created On",
                      "_name":"overriddencreatedon",
                      "_type":"datetime"
                   },
                   {
                      "_displayname":"Redirect URL",
                      "_name":"adx_url",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Redirect Web File",
                      "_name":"adx_redirectwebfileid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Release Date",
                      "_name":"adx_releasedate",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_title",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web File",
                      "_name":"adx_webfileid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webfile",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Web Template",
                      "_name":"adx_webtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"WebPage",
                      "_name":"adx_webpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_ad",
             "_displayname":"Ad",
             "_etc":"10025",
             "_primaryidfield":"adx_adid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"ad",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_updateCompare":"true",
                      "_displayname":"Ad Placement",
                      "_name":"adx_adplacementid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Web Template",
                      "_name":"adx_webtemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webtemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_adplacement_ad",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_adplacement_ad",
                   "_m2mTargetEntity":"adx_ad",
                   "_m2mTargetEntityPrimaryKey":"adx_adid"
                }
             },
             "_name":"adx_adplacement",
             "_displayname":"Ad Placement",
             "_etc":"10031",
             "_primaryidfield":"adx_adplacementid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"adplacement",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Archive Template",
                      "_name":"adx_blogarchivepagetemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_pagetemplate",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Blog",
                      "_name":"adx_blogid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Comment Policy",
                      "_name":"adx_commentpolicy",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Home Template",
                      "_name":"adx_bloghomepagetemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_pagetemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Parent Page",
                      "_name":"adx_parentpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Partial URL",
                      "_name":"adx_partialurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Post Template",
                      "_name":"adx_blogpostpagetemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_pagetemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Summary",
                      "_name":"adx_summary",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Blog Language",
                      "_name":"adx_websitelanguageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_websitelanguage",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_blog_webrole",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_blog_webrole",
                   "_m2mTargetEntity":"adx_webrole",
                   "_m2mTargetEntityPrimaryKey":"adx_webroleid"
                }
             },
             "_name":"adx_blog",
             "_displayname":"Blog",
             "_etc":"10078",
             "_primaryidfield":"adx_blogid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"blogs",
             "_propextension":"blog",
             "_exporttype":"SubFolders"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Blog",
                      "_name":"adx_blogid",
                      "_type":"entityreference",
                      "_lookupType":"adx_blog",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Blog Post",
                      "_name":"adx_blogpostid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Comment Policy",
                      "_name":"adx_commentpolicy",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Copy",
                      "_name":"adx_copy",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Date",
                      "_name":"adx_date",
                      "_type":"datetime",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable Ratings",
                      "_name":"adx_enableratings",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Partial URL",
                      "_name":"adx_partialurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Published",
                      "_name":"adx_published",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Summary",
                      "_name":"adx_summary",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Title",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_blogpost_tag",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_blogpost_tag",
                   "_m2mTargetEntity":"adx_tag",
                   "_m2mTargetEntityPrimaryKey":"adx_tagid"
                }
             },
             "_name":"adx_blogpost",
             "_displayname":"Blog Post",
             "_etc":"10079",
             "_primaryidfield":"adx_blogpostid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_parententityname":"adx_blog",
             "_parententityfield":"adx_blogid",
             "_foldername":"",
             "_propextension":"blogpost",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Description",
                      "_name":"adx_description",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Enable queued posts",
                      "_name":"adx_enablequeuedposts",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Forum",
                      "_name":"adx_communityforumid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Forum Page Template",
                      "_name":"adx_forumpagetemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_pagetemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Hidden From Sitemap",
                      "_name":"adx_hiddenfromsitemap",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Parent Page",
                      "_name":"adx_parentpageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_webpage",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Partial Url",
                      "_name":"adx_partialurl",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Post Count",
                      "_name":"adx_postcount",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Publishing State",
                      "_name":"adx_publishingstateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_publishingstate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Shows Zone Code.",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Thread Count",
                      "_name":"adx_threadcount",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Thread Page Template",
                      "_name":"adx_threadpagetemplateid",
                      "_type":"entityreference",
                      "_lookupType":"adx_pagetemplate",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Community Forum Language",
                      "_name":"adx_websitelanguageid",
                      "_type":"entityreference",
                      "_lookupType":"adx_websitelanguage",
                      "_customfield":"true"
                   }
                ]
             },
             "_name":"adx_communityforum",
             "_displayname":"Forum",
             "_etc":"10090",
             "_primaryidfield":"adx_communityforumid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"forums",
             "_propextension":"forum",
             "_exporttype":"SubFolders"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Forum",
                      "_name":"adx_forumid",
                      "_type":"entityreference",
                      "_lookupType":"adx_communityforum",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Forum Access Permission",
                      "_name":"adx_communityforumaccesspermissionid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Right",
                      "_name":"adx_right",
                      "_type":"optionsetvalue",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Shows Zone Code.",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   }
                ]
             },
             "relationships":{
                "relationship":{
                   "_name":"adx_communityforumaccesspermission_webrole",
                   "_manyToMany":"true",
                   "_isreflexive":"false",
                   "_relatedEntityName":"adx_communityforumaccesspermission_webrole",
                   "_m2mTargetEntity":"adx_webrole",
                   "_m2mTargetEntityPrimaryKey":"adx_webroleid"
                }
             },
             "_name":"adx_communityforumaccesspermission",
             "_displayname":"Forum Access Permission",
             "_etc":"10091",
             "_primaryidfield":"adx_communityforumaccesspermissionid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_parententityname":"adx_communityforum",
             "_parententityfield":"adx_forumid",
             "_foldername":"",
             "_propextension":"forumpermission",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Allows Voting",
                      "_name":"adx_allowsvoting",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Display Order",
                      "_name":"adx_displayorder",
                      "_type":"number",
                      "_customfield":"true"
                   },
                   {
                      "_updateCompare":"true",
                      "_displayname":"Forum Thread Type",
                      "_name":"adx_forumthreadtypeid",
                      "_type":"guid",
                      "_primaryKey":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Is Default",
                      "_name":"adx_isdefault",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true",
                      "_templateLocalize":"true"
                   },
                   {
                      "_displayname":"Requires Answer",
                      "_name":"adx_requiresanswer",
                      "_type":"bool",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Shows Zone Code.",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_forumthreadtype",
             "_displayname":"Forum Thread Type",
             "_etc":"10097",
             "_primaryidfield":"adx_forumthreadtypeid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"forums",
             "_propextension":"forumthreadtype",
             "_exporttype":"SingleFile"
          },
          {
             "fields":{
                "field":[
                   {
                      "_displayname":"Bot Consumer",
                      "_name":"adx_botconsumerid",
                      "_type":"guid",
                      "_primaryKey":"true",
                      "_updateCompare":"true"
                   },
                   {
                      "_displayname":"Import Sequence Number",
                      "_name":"importsequencenumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Name",
                      "_name":"adx_name",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Status",
                      "_name":"statecode",
                      "_type":"state"
                   },
                   {
                      "_displayname":"Status Reason",
                      "_name":"statuscode",
                      "_type":"status"
                   },
                   {
                      "_displayname":"Time Zone Rule Version Number",
                      "_name":"timezoneruleversionnumber",
                      "_type":"number"
                   },
                   {
                      "_displayname":"UTC Conversion Time Zone Code",
                      "_name":"utcconversiontimezonecode",
                      "_type":"number"
                   },
                   {
                      "_displayname":"Version Number",
                      "_name":"versionnumber",
                      "_type":"bigint"
                   },
                   {
                      "_displayname":"Website",
                      "_name":"adx_websiteid",
                      "_type":"entityreference",
                      "_lookupType":"adx_website",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Bot Schema Name",
                      "_name":"adx_botschemaname",
                      "_type":"string",
                      "_customfield":"true"
                   },
                   {
                      "_displayname":"Bot Configuration JSON",
                      "_name":"adx_configjson",
                      "_type":"string",
                      "_customfield":"true"
                   }
                ]
             },
             "relationships":"",
             "_name":"adx_botconsumer",
             "_displayname":"Bot Consumer",
             "_primaryidfield":"adx_botconsumerid",
             "_primarynamefield":"adx_name",
             "_disableplugins":"true",
             "_foldername":"",
             "_propextension":"botconsumer",
             "_exporttype":"SingleFile"
          }
       ],
       "_xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance"
    }
  }
