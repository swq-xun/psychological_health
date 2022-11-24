(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mammoth=f()}})(function(){var define,module,exports;return(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){var promises=require("../../lib/promises");exports.Files=Files;function Files(){function read(uri){return promises.reject(new Error("could not open external image: '"+uri+"'\ncannot open linked files from a web browser"));}
return{read:read};}},{"../../lib/promises":23}],2:[function(require,module,exports){var promises=require("../lib/promises");var zipfile=require("../lib/zipfile");exports.openZip=openZip;function openZip(options){if(options.arrayBuffer){return promises.resolve(zipfile.openArrayBuffer(options.arrayBuffer));}else{return promises.reject(new Error("Could not find file in options"));}}},{"../lib/promises":23,"../lib/zipfile":38}],3:[function(require,module,exports){var _=require("underscore");var promises=require("./promises");var documents=require("./documents");var htmlPaths=require("./styles/html-paths");var results=require("./results");var images=require("./images");var Html=require("./html");var writers=require("./writers");exports.DocumentConverter=DocumentConverter;function DocumentConverter(options){return{convertToHtml:function(element){var comments=_.indexBy(element.type===documents.types.document?element.comments:[],"commentId");var conversion=new DocumentConversion(options,comments);return conversion.convertToHtml(element);}};}
function DocumentConversion(options,comments){var noteNumber=1;var noteReferences=[];var referencedComments=[];options=_.extend({ignoreEmptyParagraphs:true},options);var idPrefix=options.idPrefix===undefined?"":options.idPrefix;var ignoreEmptyParagraphs=options.ignoreEmptyParagraphs;var defaultParagraphStyle=htmlPaths.topLevelElement("p");var styleMap=options.styleMap||[];function convertToHtml(document){var messages=[];var html=elementToHtml(document,messages,{});var deferredNodes=[];walkHtml(html,function(node){if(node.type==="deferred"){deferredNodes.push(node);}});var deferredValues={};return promises.mapSeries(deferredNodes,function(deferred){return deferred.value().then(function(value){deferredValues[deferred.id]=value;});}).then(function(){function replaceDeferred(nodes){return flatMap(nodes,function(node){if(node.type==="deferred"){return deferredValues[node.id];}else if(node.children){return[_.extend({},node,{children:replaceDeferred(node.children)})];}else{return[node];}});}
var writer=writers.writer({prettyPrint:options.prettyPrint,outputFormat:options.outputFormat});Html.write(writer,Html.simplify(replaceDeferred(html)));return new results.Result(writer.asString(),messages);});}
function convertElements(elements,messages,options){return flatMap(elements,function(element){return elementToHtml(element,messages,options);});}
function elementToHtml(element,messages,options){if(!options){throw new Error("options not set");}
var handler=elementConverters[element.type];if(handler){return handler(element,messages,options);}else{return[];}}
function convertParagraph(element,messages,options){return htmlPathForParagraph(element,messages).wrap(function(){var content=convertElements(element.children,messages,options);if(ignoreEmptyParagraphs){return content;}else{return[Html.forceWrite].concat(content);}});}
function htmlPathForParagraph(element,messages){var style=findStyle(element);if(style){return style.to;}else{if(element.styleId){messages.push(unrecognisedStyleWarning("paragraph",element));}
return defaultParagraphStyle;}}
function convertRun(run,messages,options){var nodes=function(){return convertElements(run.children,messages,options);};var paths=[];if(run.isSmallCaps){paths.push(findHtmlPathForRunProperty("smallCaps"));}
if(run.isStrikethrough){paths.push(findHtmlPathForRunProperty("strikethrough","s"));}
if(run.isUnderline){paths.push(findHtmlPathForRunProperty("underline"));}
if(run.verticalAlignment===documents.verticalAlignment.subscript){paths.push(htmlPaths.element("sub",{},{fresh:false}));}
if(run.verticalAlignment===documents.verticalAlignment.superscript){paths.push(htmlPaths.element("sup",{},{fresh:false}));}
if(run.isItalic){paths.push(findHtmlPathForRunProperty("italic","em"));}
if(run.isBold){paths.push(findHtmlPathForRunProperty("bold","strong"));}
var stylePath=htmlPaths.empty;var style=findStyle(run);if(style){stylePath=style.to;}else if(run.styleId){messages.push(unrecognisedStyleWarning("run",run));}
paths.push(stylePath);paths.forEach(function(path){nodes=path.wrap.bind(path,nodes);});return nodes();}
function findHtmlPathForRunProperty(elementType,defaultTagName){var path=findHtmlPath({type:elementType});if(path){return path;}else if(defaultTagName){return htmlPaths.element(defaultTagName,{},{fresh:false});}else{return htmlPaths.empty;}}
function findHtmlPath(element,defaultPath){var style=findStyle(element);return style?style.to:defaultPath;}
function findStyle(element){for(var i=0;i<styleMap.length;i++){if(styleMap[i].from.matches(element)){return styleMap[i];}}}
function recoveringConvertImage(convertImage){return function(image,messages){return promises.attempt(function(){return convertImage(image,messages);}).caught(function(error){messages.push(results.error(error));return[];});};}
function noteHtmlId(note){return referentHtmlId(note.noteType,note.noteId);}
function noteRefHtmlId(note){return referenceHtmlId(note.noteType,note.noteId);}
function referentHtmlId(referenceType,referenceId){return htmlId(referenceType+"-"+referenceId);}
function referenceHtmlId(referenceType,referenceId){return htmlId(referenceType+"-ref-"+referenceId);}
function htmlId(suffix){return idPrefix+suffix;}
var defaultTablePath=htmlPaths.elements([htmlPaths.element("table",{},{fresh:true})]);function convertTable(element,messages,options){return findHtmlPath(element,defaultTablePath).wrap(function(){return convertTableChildren(element,messages,options);});}
function convertTableChildren(element,messages,options){var bodyIndex=_.findIndex(element.children,function(child){return!child.type===documents.types.tableRow||!child.isHeader;});if(bodyIndex===-1){bodyIndex=element.children.length;}
var children;if(bodyIndex===0){children=convertElements(element.children,messages,_.extend({},options,{isTableHeader:false}));}else{var headRows=convertElements(element.children.slice(0,bodyIndex),messages,_.extend({},options,{isTableHeader:true}));var bodyRows=convertElements(element.children.slice(bodyIndex),messages,_.extend({},options,{isTableHeader:false}));children=[Html.freshElement("thead",{},headRows),Html.freshElement("tbody",{},bodyRows)];}
return[Html.forceWrite].concat(children);}
function convertTableRow(element,messages,options){var children=convertElements(element.children,messages,options);return[Html.freshElement("tr",{},[Html.forceWrite].concat(children))];}
function convertTableCell(element,messages,options){var tagName=options.isTableHeader?"th":"td";var children=convertElements(element.children,messages,options);var attributes={};if(element.colSpan!==1){attributes.colspan=element.colSpan.toString();}
if(element.rowSpan!==1){attributes.rowspan=element.rowSpan.toString();}
return[Html.freshElement(tagName,attributes,[Html.forceWrite].concat(children))];}
function convertCommentReference(reference,messages,options){return findHtmlPath(reference,htmlPaths.ignore).wrap(function(){var comment=comments[reference.commentId];var count=referencedComments.length+1;var label="["+commentAuthorLabel(comment)+count+"]";referencedComments.push({label:label,comment:comment});return[Html.freshElement("a",{href:"#"+referentHtmlId("comment",reference.commentId),id:referenceHtmlId("comment",reference.commentId)},[Html.text(label)])];});}
function convertComment(referencedComment,messages,options){var label=referencedComment.label;var comment=referencedComment.comment;var body=convertElements(comment.body,messages,options).concat([Html.nonFreshElement("p",{},[Html.text(" "),Html.freshElement("a",{"href":"#"+referenceHtmlId("comment",comment.commentId)},[Html.text("↑")])])]);return[Html.freshElement("dt",{"id":referentHtmlId("comment",comment.commentId)},[Html.text("Comment "+label)]),Html.freshElement("dd",{},body)];}
function convertBreak(element,messages,options){return htmlPathForBreak(element).wrap(function(){return[];});}
function htmlPathForBreak(element){var style=findStyle(element);if(style){return style.to;}else if(element.breakType==="line"){return htmlPaths.topLevelElement("br");}else{return htmlPaths.empty;}}
var elementConverters={"document":function(document,messages,options){var children=convertElements(document.children,messages,options);var notes=noteReferences.map(function(noteReference){return document.notes.resolve(noteReference);});var notesNodes=convertElements(notes,messages,options);return children.concat([Html.freshElement("ol",{},notesNodes),Html.freshElement("dl",{},flatMap(referencedComments,function(referencedComment){return convertComment(referencedComment,messages,options);}))]);},"paragraph":convertParagraph,"run":convertRun,"text":function(element,messages,options){return[Html.text(element.value)];},"tab":function(element,messages,options){return[Html.text("\t")];},"hyperlink":function(element,messages,options){var href=element.anchor?"#"+htmlId(element.anchor):element.href;var attributes={href:href};if(element.targetFrame!=null){attributes.target=element.targetFrame;}
var children=convertElements(element.children,messages,options);return[Html.freshElement("a",attributes,children)];},"bookmarkStart":function(element,messages,options){var anchor=Html.freshElement("a",{id:htmlId(element.name)},[Html.forceWrite]);return[anchor];},"noteReference":function(element,messages,options){noteReferences.push(element);var anchor=Html.freshElement("a",{href:"#"+noteHtmlId(element),id:noteRefHtmlId(element)},[Html.text("["+(noteNumber++)+"]")]);return[Html.freshElement("sup",{},[anchor])];},"note":function(element,messages,options){var children=convertElements(element.body,messages,options);var backLink=Html.elementWithTag(htmlPaths.element("p",{},{fresh:false}),[Html.text(" "),Html.freshElement("a",{href:"#"+noteRefHtmlId(element)},[Html.text("↑")])]);var body=children.concat([backLink]);return Html.freshElement("li",{id:noteHtmlId(element)},body);},"commentReference":convertCommentReference,"comment":convertComment,"image":deferredConversion(recoveringConvertImage(options.convertImage||images.dataUri)),"table":convertTable,"tableRow":convertTableRow,"tableCell":convertTableCell,"break":convertBreak};return{convertToHtml:convertToHtml};}
var deferredId=1;function deferredConversion(func){return function(element,messages,options){return[{type:"deferred",id:deferredId++,value:function(){return func(element,messages,options);}}];};}
function unrecognisedStyleWarning(type,element){return results.warning("Unrecognised "+type+" style: '"+element.styleName+"'"+
" (Style ID: "+element.styleId+")");}
function flatMap(values,func){return _.flatten(values.map(func),true);}
function walkHtml(nodes,callback){nodes.forEach(function(node){callback(node);if(node.children){walkHtml(node.children,callback);}});}
var commentAuthorLabel=exports.commentAuthorLabel=function commentAuthorLabel(comment){return comment.authorInitials||"";};},{"./documents":4,"./html":18,"./images":20,"./promises":23,"./results":24,"./styles/html-paths":27,"./writers":32,"underscore":153}],4:[function(require,module,exports){var _=require("underscore");var types=exports.types={document:"document",paragraph:"paragraph",run:"run",text:"text",tab:"tab",hyperlink:"hyperlink",noteReference:"noteReference",image:"image",note:"note",commentReference:"commentReference",comment:"comment",table:"table",tableRow:"tableRow",tableCell:"tableCell","break":"break",bookmarkStart:"bookmarkStart"};function Document(children,options){options=options||{};return{type:types.document,children:children,notes:options.notes||new Notes({}),comments:options.comments||[]};}
function Paragraph(children,properties){properties=properties||{};var indent=properties.indent||{};return{type:types.paragraph,children:children,styleId:properties.styleId||null,styleName:properties.styleName||null,numbering:properties.numbering||null,alignment:properties.alignment||null,indent:{start:indent.start||null,end:indent.end||null,firstLine:indent.firstLine||null,hanging:indent.hanging||null}};}
function Run(children,properties){properties=properties||{};return{type:types.run,children:children,styleId:properties.styleId||null,styleName:properties.styleName||null,isBold:properties.isBold,isUnderline:properties.isUnderline,isItalic:properties.isItalic,isStrikethrough:properties.isStrikethrough,isSmallCaps:properties.isSmallCaps,verticalAlignment:properties.verticalAlignment||verticalAlignment.baseline,font:properties.font||null};}
var verticalAlignment={baseline:"baseline",superscript:"superscript",subscript:"subscript"};function Text(value){return{type:types.text,value:value};}
function Tab(){return{type:types.tab};}
function Hyperlink(children,options){return{type:types.hyperlink,children:children,href:options.href,anchor:options.anchor,targetFrame:options.targetFrame};}
function NoteReference(options){return{type:types.noteReference,noteType:options.noteType,noteId:options.noteId};}
function Notes(notes){this._notes=_.indexBy(notes,function(note){return noteKey(note.noteType,note.noteId);});}
Notes.prototype.resolve=function(reference){return this.findNoteByKey(noteKey(reference.noteType,reference.noteId));};Notes.prototype.findNoteByKey=function(key){return this._notes[key]||null;};function Note(options){return{type:types.note,noteType:options.noteType,noteId:options.noteId,body:options.body};}
function commentReference(options){return{type:types.commentReference,commentId:options.commentId};}
function comment(options){return{type:types.comment,commentId:options.commentId,body:options.body,authorName:options.authorName,authorInitials:options.authorInitials};}
function noteKey(noteType,id){return noteType+"-"+id;}
function Image(options){return{type:types.image,read:options.readImage,altText:options.altText,contentType:options.contentType};}
function Table(children,properties){properties=properties||{};return{type:types.table,children:children,styleId:properties.styleId||null,styleName:properties.styleName||null};}
function TableRow(children,options){options=options||{};return{type:types.tableRow,children:children,isHeader:options.isHeader||false};}
function TableCell(children,options){options=options||{};return{type:types.tableCell,children:children,colSpan:options.colSpan==null?1:options.colSpan,rowSpan:options.rowSpan==null?1:options.rowSpan};}
function Break(breakType){return{type:types["break"],breakType:breakType};}
function BookmarkStart(options){return{type:types.bookmarkStart,name:options.name};}
exports.document=exports.Document=Document;exports.paragraph=exports.Paragraph=Paragraph;exports.run=exports.Run=Run;exports.Text=Text;exports.tab=exports.Tab=Tab;exports.Hyperlink=Hyperlink;exports.noteReference=exports.NoteReference=NoteReference;exports.Notes=Notes;exports.Note=Note;exports.commentReference=commentReference;exports.comment=comment;exports.Image=Image;exports.Table=Table;exports.TableRow=TableRow;exports.TableCell=TableCell;exports.lineBreak=Break("line");exports.pageBreak=Break("page");exports.columnBreak=Break("column");exports.BookmarkStart=BookmarkStart;exports.verticalAlignment=verticalAlignment;},{"underscore":153}],5:[function(require,module,exports){exports.createBodyReader=createBodyReader;exports._readNumberingProperties=readNumberingProperties;var _=require("underscore");var documents=require("../documents");var Result=require("../results").Result;var warning=require("../results").warning;var uris=require("./uris");function createBodyReader(options){return{readXmlElement:function(element){return new BodyReader(options).readXmlElement(element);},readXmlElements:function(elements){return new BodyReader(options).readXmlElements(elements);}};}
function BodyReader(options){var complexFieldStack=[];var currentInstrText=[];var relationships=options.relationships;var contentTypes=options.contentTypes;var docxFile=options.docxFile;var files=options.files;var numbering=options.numbering;var styles=options.styles;function readXmlElements(elements){var results=elements.map(readXmlElement);return combineResults(results);}
function readXmlElement(element){if(element.type==="element"){var handler=xmlElementReaders[element.name];if(handler){return handler(element);}else if(!Object.prototype.hasOwnProperty.call(ignoreElements,element.name)){var message=warning("An unrecognised element was ignored: "+element.name);return emptyResultWithMessages([message]);}}
return emptyResult();}
function readParagraphIndent(element){return{start:element.attributes["w:start"]||element.attributes["w:left"],end:element.attributes["w:end"]||element.attributes["w:right"],firstLine:element.attributes["w:firstLine"],hanging:element.attributes["w:hanging"]};}
function readRunProperties(element){return readRunStyle(element).map(function(style){return{type:"runProperties",styleId:style.styleId,styleName:style.name,verticalAlignment:element.firstOrEmpty("w:vertAlign").attributes["w:val"],font:element.firstOrEmpty("w:rFonts").attributes["w:ascii"],isBold:readBooleanElement(element.first("w:b")),isUnderline:readBooleanElement(element.first("w:u")),isItalic:readBooleanElement(element.first("w:i")),isStrikethrough:readBooleanElement(element.first("w:strike")),isSmallCaps:readBooleanElement(element.first("w:smallCaps"))};});}
function readBooleanElement(element){if(element){var value=element.attributes["w:val"];return value!=="false"&&value!=="0";}else{return false;}}
function readParagraphStyle(element){return readStyle(element,"w:pStyle","Paragraph",styles.findParagraphStyleById);}
function readRunStyle(element){return readStyle(element,"w:rStyle","Run",styles.findCharacterStyleById);}
function readTableStyle(element){return readStyle(element,"w:tblStyle","Table",styles.findTableStyleById);}
function readStyle(element,styleTagName,styleType,findStyleById){var messages=[];var styleElement=element.first(styleTagName);var styleId=null;var name=null;if(styleElement){styleId=styleElement.attributes["w:val"];if(styleId){var style=findStyleById(styleId);if(style){name=style.name;}else{messages.push(undefinedStyleWarning(styleType,styleId));}}}
return elementResultWithMessages({styleId:styleId,name:name},messages);}
var unknownComplexField={type:"unknown"};function readFldChar(element){var type=element.attributes["w:fldCharType"];if(type==="begin"){complexFieldStack.push(unknownComplexField);currentInstrText=[];}else if(type==="end"){complexFieldStack.pop();}else if(type==="separate"){var href=parseHyperlinkFieldCode(currentInstrText.join(''));var complexField=href===null?unknownComplexField:{type:"hyperlink",href:href};complexFieldStack.pop();complexFieldStack.push(complexField);}
return emptyResult();}
function currentHyperlinkHref(){var topHyperlink=_.last(complexFieldStack.filter(function(complexField){return complexField.type==="hyperlink";}));return topHyperlink?topHyperlink.href:null;}
function parseHyperlinkFieldCode(code){var result=/\s*HYPERLINK "(.*)"/.exec(code);if(result){return result[1];}else{return null;}}
function readInstrText(element){currentInstrText.push(element.text());return emptyResult();}
function noteReferenceReader(noteType){return function(element){var noteId=element.attributes["w:id"];return elementResult(new documents.NoteReference({noteType:noteType,noteId:noteId}));};}
function readCommentReference(element){return elementResult(documents.commentReference({commentId:element.attributes["w:id"]}));}
function readChildElements(element){return readXmlElements(element.children);}
var xmlElementReaders={"w:p":function(element){return readXmlElements(element.children).map(function(children){var properties=_.find(children,isParagraphProperties);return new documents.Paragraph(children.filter(negate(isParagraphProperties)),properties);}).insertExtra();},"w:pPr":function(element){return readParagraphStyle(element).map(function(style){return{type:"paragraphProperties",styleId:style.styleId,styleName:style.name,alignment:element.firstOrEmpty("w:jc").attributes["w:val"],numbering:readNumberingProperties(element.firstOrEmpty("w:numPr"),numbering),indent:readParagraphIndent(element.firstOrEmpty("w:ind"))};});},"w:r":function(element){return readXmlElements(element.children).map(function(children){var properties=_.find(children,isRunProperties);children=children.filter(negate(isRunProperties));var hyperlinkHref=currentHyperlinkHref();if(hyperlinkHref!==null){children=[new documents.Hyperlink(children,{href:hyperlinkHref})];}
return new documents.Run(children,properties);});},"w:rPr":readRunProperties,"w:fldChar":readFldChar,"w:instrText":readInstrText,"w:t":function(element){return elementResult(new documents.Text(element.text()));},"w:tab":function(element){return elementResult(new documents.Tab());},"w:noBreakHyphen":function(){return elementResult(new documents.Text("\u2011"));},"w:hyperlink":function(element){var relationshipId=element.attributes["r:id"];var anchor=element.attributes["w:anchor"];return readXmlElements(element.children).map(function(children){function create(options){var targetFrame=element.attributes["w:tgtFrame"]||null;return new documents.Hyperlink(children,_.extend({targetFrame:targetFrame},options));}
if(relationshipId){var href=relationships.findTargetByRelationshipId(relationshipId);if(anchor){href=uris.replaceFragment(href,anchor);}
return create({href:href});}else if(anchor){return create({anchor:anchor});}else{return children;}});},"w:tbl":readTable,"w:tr":readTableRow,"w:tc":readTableCell,"w:footnoteReference":noteReferenceReader("footnote"),"w:endnoteReference":noteReferenceReader("endnote"),"w:commentReference":readCommentReference,"w:br":function(element){var breakType=element.attributes["w:type"];if(breakType==null||breakType==="textWrapping"){return elementResult(documents.lineBreak);}else if(breakType==="page"){return elementResult(documents.pageBreak);}else if(breakType==="column"){return elementResult(documents.columnBreak);}else{return emptyResultWithMessages([warning("Unsupported break type: "+breakType)]);}},"w:bookmarkStart":function(element){var name=element.attributes["w:name"];if(name==="_GoBack"){return emptyResult();}else{return elementResult(new documents.BookmarkStart({name:name}));}},"mc:AlternateContent":function(element){return readChildElements(element.first("mc:Fallback"));},"w:sdt":function(element){return readXmlElements(element.firstOrEmpty("w:sdtContent").children);},"w:ins":readChildElements,"w:object":readChildElements,"w:smartTag":readChildElements,"w:drawing":readChildElements,"w:pict":function(element){return readChildElements(element).toExtra();},"v:roundrect":readChildElements,"v:shape":readChildElements,"v:textbox":readChildElements,"w:txbxContent":readChildElements,"wp:inline":readDrawingElement,"wp:anchor":readDrawingElement,"v:imagedata":readImageData,"v:group":readChildElements,"v:rect":readChildElements};return{readXmlElement:readXmlElement,readXmlElements:readXmlElements};function readTable(element){var propertiesResult=readTableProperties(element.firstOrEmpty("w:tblPr"));return readXmlElements(element.children).flatMap(calculateRowSpans).flatMap(function(children){return propertiesResult.map(function(properties){return documents.Table(children,properties);});});}
function readTableProperties(element){return readTableStyle(element).map(function(style){return{styleId:style.styleId,styleName:style.name};});}
function readTableRow(element){var properties=element.firstOrEmpty("w:trPr");var isHeader=!!properties.first("w:tblHeader");return readXmlElements(element.children).map(function(children){return documents.TableRow(children,{isHeader:isHeader});});}
function readTableCell(element){return readXmlElements(element.children).map(function(children){var properties=element.firstOrEmpty("w:tcPr");var gridSpan=properties.firstOrEmpty("w:gridSpan").attributes["w:val"];var colSpan=gridSpan?parseInt(gridSpan,10):1;var cell=documents.TableCell(children,{colSpan:colSpan});cell._vMerge=readVMerge(properties);return cell;});}
function readVMerge(properties){var element=properties.first("w:vMerge");if(element){var val=element.attributes["w:val"];return val==="continue"||!val;}else{return null;}}
function calculateRowSpans(rows){var unexpectedNonRows=_.any(rows,function(row){return row.type!==documents.types.tableRow;});if(unexpectedNonRows){return elementResultWithMessages(rows,[warning("unexpected non-row element in table, cell merging may be incorrect")]);}
var unexpectedNonCells=_.any(rows,function(row){return _.any(row.children,function(cell){return cell.type!==documents.types.tableCell;});});if(unexpectedNonCells){return elementResultWithMessages(rows,[warning("unexpected non-cell element in table row, cell merging may be incorrect")]);}
var columns={};rows.forEach(function(row){var cellIndex=0;row.children.forEach(function(cell){if(cell._vMerge&&columns[cellIndex]){columns[cellIndex].rowSpan++;}else{columns[cellIndex]=cell;cell._vMerge=false;}
cellIndex+=cell.colSpan;});});rows.forEach(function(row){row.children=row.children.filter(function(cell){return!cell._vMerge;});row.children.forEach(function(cell){delete cell._vMerge;});});return elementResult(rows);}
function readDrawingElement(element){var blips=element.getElementsByTagName("a:graphic").getElementsByTagName("a:graphicData").getElementsByTagName("pic:pic").getElementsByTagName("pic:blipFill").getElementsByTagName("a:blip");return combineResults(blips.map(readBlip.bind(null,element)));}
function readBlip(element,blip){var properties=element.first("wp:docPr").attributes;var altText=isBlank(properties.descr)?properties.title:properties.descr;return readImage(findBlipImageFile(blip),altText);}
function isBlank(value){return value==null||/^\s*$/.test(value);}
function findBlipImageFile(blip){var embedRelationshipId=blip.attributes["r:embed"];var linkRelationshipId=blip.attributes["r:link"];if(embedRelationshipId){return findEmbeddedImageFile(embedRelationshipId);}else{var imagePath=relationships.findTargetByRelationshipId(linkRelationshipId);return{path:imagePath,read:files.read.bind(files,imagePath)};}}
function readImageData(element){var relationshipId=element.attributes['r:id'];if(relationshipId){return readImage(findEmbeddedImageFile(relationshipId),element.attributes["o:title"]);}else{return emptyResultWithMessages([warning("A v:imagedata element without a relationship ID was ignored")]);}}
function findEmbeddedImageFile(relationshipId){var path=uris.uriToZipEntryName("word",relationships.findTargetByRelationshipId(relationshipId));return{path:path,read:docxFile.read.bind(docxFile,path)};}
function readImage(imageFile,altText){var contentType=contentTypes.findContentType(imageFile.path);var image=documents.Image({readImage:imageFile.read,altText:altText,contentType:contentType});var warnings=supportedImageTypes[contentType]?[]:warning("Image of type "+contentType+" is unlikely to display in web browsers");return elementResultWithMessages(image,warnings);}
function undefinedStyleWarning(type,styleId){return warning(type+" style with ID "+styleId+" was referenced but not defined in the document");}}
function readNumberingProperties(element,numbering){var level=element.firstOrEmpty("w:ilvl").attributes["w:val"];var numId=element.firstOrEmpty("w:numId").attributes["w:val"];if(level===undefined||numId===undefined){return null;}else{return numbering.findLevel(numId,level);}}
var supportedImageTypes={"image/png":true,"image/gif":true,"image/jpeg":true,"image/svg+xml":true,"image/tiff":true};var ignoreElements={"office-word:wrap":true,"v:shadow":true,"v:shapetype":true,"w:annotationRef":true,"w:bookmarkEnd":true,"w:sectPr":true,"w:proofErr":true,"w:lastRenderedPageBreak":true,"w:commentRangeStart":true,"w:commentRangeEnd":true,"w:del":true,"w:footnoteRef":true,"w:endnoteRef":true,"w:tblPr":true,"w:tblGrid":true,"w:trPr":true,"w:tcPr":true};function isParagraphProperties(element){return element.type==="paragraphProperties";}
function isRunProperties(element){return element.type==="runProperties";}
function negate(predicate){return function(value){return!predicate(value);};}
function emptyResultWithMessages(messages){return new ReadResult(null,null,messages);}
function emptyResult(){return new ReadResult(null);}
function elementResult(element){return new ReadResult(element);}
function elementResultWithMessages(element,messages){return new ReadResult(element,null,messages);}
function ReadResult(element,extra,messages){this.value=element||[];this.extra=extra;this._result=new Result({element:this.value,extra:extra},messages);this.messages=this._result.messages;}
ReadResult.prototype.toExtra=function(){return new ReadResult(null,joinElements(this.extra,this.value),this.messages);};ReadResult.prototype.insertExtra=function(){var extra=this.extra;if(extra&&extra.length){return new ReadResult(joinElements(this.value,extra),null,this.messages);}else{return this;}};ReadResult.prototype.map=function(func){var result=this._result.map(function(value){return func(value.element);});return new ReadResult(result.value,this.extra,result.messages);};ReadResult.prototype.flatMap=function(func){var result=this._result.flatMap(function(value){return func(value.element)._result;});return new ReadResult(result.value.element,joinElements(this.extra,result.value.extra),result.messages);};function combineResults(results){var result=Result.combine(_.pluck(results,"_result"));return new ReadResult(_.flatten(_.pluck(result.value,"element")),_.filter(_.flatten(_.pluck(result.value,"extra")),identity),result.messages);}
function joinElements(first,second){return _.flatten([first,second]);}
function identity(value){return value;}},{"../documents":4,"../results":24,"./uris":16,"underscore":153}],6:[function(require,module,exports){var documents=require("../documents");var Result=require("../results").Result;function createCommentsReader(bodyReader){function readCommentsXml(element){return Result.combine(element.getElementsByTagName("w:comment").map(readCommentElement));}
function readCommentElement(element){var id=element.attributes["w:id"];function readOptionalAttribute(name){return(element.attributes[name]||"").trim()||null;}
return bodyReader.readXmlElements(element.children).map(function(body){return documents.comment({commentId:id,body:body,authorName:readOptionalAttribute("w:author"),authorInitials:readOptionalAttribute("w:initials")});});}
return readCommentsXml;}
exports.createCommentsReader=createCommentsReader;},{"../documents":4,"../results":24}],7:[function(require,module,exports){exports.readContentTypesFromXml=readContentTypesFromXml;var fallbackContentTypes={"png":"png","gif":"gif","jpeg":"jpeg","jpg":"jpeg","tif":"tiff","tiff":"tiff","bmp":"bmp"};exports.defaultContentTypes=contentTypes({},{});function readContentTypesFromXml(element){var extensionDefaults={};var overrides={};element.children.forEach(function(child){if(child.name==="content-types:Default"){extensionDefaults[child.attributes.Extension]=child.attributes.ContentType;}
if(child.name==="content-types:Override"){var name=child.attributes.PartName;if(name.charAt(0)==="/"){name=name.substring(1);}
overrides[name]=child.attributes.ContentType;}});return contentTypes(overrides,extensionDefaults);}
function contentTypes(overrides,extensionDefaults){return{findContentType:function(path){var overrideContentType=overrides[path];if(overrideContentType){return overrideContentType;}else{var pathParts=path.split(".");var extension=pathParts[pathParts.length-1];if(extensionDefaults.hasOwnProperty(extension)){return extensionDefaults[extension];}else{var fallback=fallbackContentTypes[extension.toLowerCase()];if(fallback){return "image/"+fallback;}else{return null;}}}}};}},{}],8:[function(require,module,exports){exports.DocumentXmlReader=DocumentXmlReader;var documents=require("../documents");var Result=require("../results").Result;function DocumentXmlReader(options){var bodyReader=options.bodyReader;function convertXmlToDocument(element){var body=element.first("w:body");var result=bodyReader.readXmlElements(body.children).map(function(children){return new documents.Document(children,{notes:options.notes,comments:options.comments});});return new Result(result.value,result.messages);}
return{convertXmlToDocument:convertXmlToDocument};}},{"../documents":4,"../results":24}],9:[function(require,module,exports){exports.read=read;exports._findPartPaths=findPartPaths;var path=require("path");var promises=require("../promises");var documents=require("../documents");var Result=require("../results").Result;var zipfile=require("../zipfile");var readXmlFromZipFile=require("./office-xml-reader").readXmlFromZipFile;var createBodyReader=require("./body-reader").createBodyReader;var DocumentXmlReader=require("./document-xml-reader").DocumentXmlReader;var relationshipsReader=require("./relationships-reader");var contentTypesReader=require("./content-types-reader");var numberingXml=require("./numbering-xml");var stylesReader=require("./styles-reader");var notesReader=require("./notes-reader");var commentsReader=require("./comments-reader");var Files=require("./files").Files;function read(docxFile,input){input=input||{};return promises.props({contentTypes:readContentTypesFromZipFile(docxFile),partPaths:findPartPaths(docxFile),docxFile:docxFile,files:new Files(input.path?path.dirname(input.path):null)}).also(function(result){return{styles:readStylesFromZipFile(docxFile,result.partPaths.styles)};}).also(function(result){return{numbering:readNumberingFromZipFile(docxFile,result.partPaths.numbering,result.styles)};}).also(function(result){return{footnotes:readXmlFileWithBody(result.partPaths.footnotes,result,function(bodyReader,xml){if(xml){return notesReader.createFootnotesReader(bodyReader)(xml);}else{return new Result([]);}}),endnotes:readXmlFileWithBody(result.partPaths.endnotes,result,function(bodyReader,xml){if(xml){return notesReader.createEndnotesReader(bodyReader)(xml);}else{return new Result([]);}}),comments:readXmlFileWithBody(result.partPaths.comments,result,function(bodyReader,xml){if(xml){return commentsReader.createCommentsReader(bodyReader)(xml);}else{return new Result([]);}})};}).also(function(result){return{notes:result.footnotes.flatMap(function(footnotes){return result.endnotes.map(function(endnotes){return new documents.Notes(footnotes.concat(endnotes));});})};}).then(function(result){return readXmlFileWithBody(result.partPaths.mainDocument,result,function(bodyReader,xml){return result.notes.flatMap(function(notes){return result.comments.flatMap(function(comments){var reader=new DocumentXmlReader({bodyReader:bodyReader,notes:notes,comments:comments});return reader.convertXmlToDocument(xml);});});});});}
function findPartPaths(docxFile){return readPackageRelationships(docxFile).then(function(packageRelationships){var mainDocumentPath=findPartPath({docxFile:docxFile,relationships:packageRelationships,relationshipType:"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",basePath:"",fallbackPath:"word/document.xml"});if(!docxFile.exists(mainDocumentPath)){throw new Error("Could not find main document part. Are you sure this is a valid .docx file?");}
return xmlFileReader({filename:relationshipsFilename(mainDocumentPath),readElement:relationshipsReader.readRelationships,defaultValue:relationshipsReader.defaultValue})(docxFile).then(function(documentRelationships){function findPartRelatedToMainDocument(name){return findPartPath({docxFile:docxFile,relationships:documentRelationships,relationshipType:"http://schemas.openxmlformats.org/officeDocument/2006/relationships/"+name,basePath:zipfile.splitPath(mainDocumentPath).dirname,fallbackPath:"word/"+name+".xml"});}
return{mainDocument:mainDocumentPath,comments:findPartRelatedToMainDocument("comments"),endnotes:findPartRelatedToMainDocument("endnotes"),footnotes:findPartRelatedToMainDocument("footnotes"),numbering:findPartRelatedToMainDocument("numbering"),styles:findPartRelatedToMainDocument("styles")};});});}
function findPartPath(options){var docxFile=options.docxFile;var relationships=options.relationships;var relationshipType=options.relationshipType;var basePath=options.basePath;var fallbackPath=options.fallbackPath;var targets=relationships.findTargetsByType(relationshipType);var normalisedTargets=targets.map(function(target){return stripPrefix(zipfile.joinPath(basePath,target),"/");});var validTargets=normalisedTargets.filter(function(target){return docxFile.exists(target);});if(validTargets.length===0){return fallbackPath;}else{return validTargets[0];}}
function stripPrefix(value,prefix){if(value.substring(0,prefix.length)===prefix){return value.substring(prefix.length);}else{return value;}}
function xmlFileReader(options){return function(zipFile){return readXmlFromZipFile(zipFile,options.filename).then(function(element){return element?options.readElement(element):options.defaultValue;});};}
function readXmlFileWithBody(filename,options,func){var readRelationshipsFromZipFile=xmlFileReader({filename:relationshipsFilename(filename),readElement:relationshipsReader.readRelationships,defaultValue:relationshipsReader.defaultValue});return readRelationshipsFromZipFile(options.docxFile).then(function(relationships){var bodyReader=new createBodyReader({relationships:relationships,contentTypes:options.contentTypes,docxFile:options.docxFile,numbering:options.numbering,styles:options.styles,files:options.files});return readXmlFromZipFile(options.docxFile,filename).then(function(xml){return func(bodyReader,xml);});});}
function relationshipsFilename(filename){var split=zipfile.splitPath(filename);return zipfile.joinPath(split.dirname,"_rels",split.basename+".rels");}
var readContentTypesFromZipFile=xmlFileReader({filename:"[Content_Types].xml",readElement:contentTypesReader.readContentTypesFromXml,defaultValue:contentTypesReader.defaultContentTypes});function readNumberingFromZipFile(zipFile,path,styles){return xmlFileReader({filename:path,readElement:function(element){return numberingXml.readNumberingXml(element,{styles:styles});},defaultValue:numberingXml.defaultNumbering})(zipFile);}
function readStylesFromZipFile(zipFile,path){return xmlFileReader({filename:path,readElement:stylesReader.readStylesXml,defaultValue:stylesReader.defaultStyles})(zipFile);}
var readPackageRelationships=xmlFileReader({filename:"_rels/.rels",readElement:relationshipsReader.readRelationships,defaultValue:relationshipsReader.defaultValue});},{"../documents":4,"../promises":23,"../results":24,"../zipfile":38,"./body-reader":5,"./comments-reader":6,"./content-types-reader":7,"./document-xml-reader":8,"./files":1,"./notes-reader":10,"./numbering-xml":11,"./office-xml-reader":12,"./relationships-reader":13,"./styles-reader":15,"path":136}],10:[function(require,module,exports){var documents=require("../documents");var Result=require("../results").Result;exports.createFootnotesReader=createReader.bind(this,"footnote");exports.createEndnotesReader=createReader.bind(this,"endnote");function createReader(noteType,bodyReader){function readNotesXml(element){return Result.combine(element.getElementsByTagName("w:"+noteType).filter(isFootnoteElement).map(readFootnoteElement));}
function isFootnoteElement(element){var type=element.attributes["w:type"];return type!=="continuationSeparator"&&type!=="separator";}
function readFootnoteElement(footnoteElement){var id=footnoteElement.attributes["w:id"];return bodyReader.readXmlElements(footnoteElement.children).map(function(body){return documents.Note({noteType:noteType,noteId:id,body:body});});}
return readNotesXml;}},{"../documents":4,"../results":24}],11:[function(require,module,exports){exports.readNumberingXml=readNumberingXml;exports.Numbering=Numbering;exports.defaultNumbering=new Numbering({});function Numbering(nums,abstractNums,styles){function findLevel(numId,level){var num=nums[numId];if(num){var abstractNum=abstractNums[num.abstractNumId];if(abstractNum.numStyleLink==null){return abstractNums[num.abstractNumId].levels[level];}else{var style=styles.findNumberingStyleById(abstractNum.numStyleLink);return findLevel(style.numId,level);}}else{return null;}}
return{findLevel:findLevel};}
function readNumberingXml(root,options){if(!options||!options.styles){throw new Error("styles is missing");}
var abstractNums=readAbstractNums(root);var nums=readNums(root,abstractNums);return new Numbering(nums,abstractNums,options.styles);}
function readAbstractNums(root){var abstractNums={};root.getElementsByTagName("w:abstractNum").forEach(function(element){var id=element.attributes["w:abstractNumId"];abstractNums[id]=readAbstractNum(element);});return abstractNums;}
function readAbstractNum(element){var levels={};element.getElementsByTagName("w:lvl").forEach(function(levelElement){var levelIndex=levelElement.attributes["w:ilvl"];var numFmt=levelElement.first("w:numFmt").attributes["w:val"];levels[levelIndex]={isOrdered:numFmt!=="bullet",level:levelIndex};});var numStyleLink=element.firstOrEmpty("w:numStyleLink").attributes["w:val"];return{levels:levels,numStyleLink:numStyleLink};}
function readNums(root){var nums={};root.getElementsByTagName("w:num").forEach(function(element){var numId=element.attributes["w:numId"];var abstractNumId=element.first("w:abstractNumId").attributes["w:val"];nums[numId]={abstractNumId:abstractNumId};});return nums;}},{}],12:[function(require,module,exports){var _=require("underscore");var promises=require("../promises");var xml=require("../xml");exports.read=read;exports.readXmlFromZipFile=readXmlFromZipFile;var xmlNamespaceMap={"http://schemas.openxmlformats.org/wordprocessingml/2006/main":"w","http://schemas.openxmlformats.org/officeDocument/2006/relationships":"r","http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing":"wp","http://schemas.openxmlformats.org/drawingml/2006/main":"a","http://schemas.openxmlformats.org/drawingml/2006/picture":"pic","http://schemas.openxmlformats.org/package/2006/content-types":"content-types","urn:schemas-microsoft-com:vml":"v","http://schemas.openxmlformats.org/markup-compatibility/2006":"mc","urn:schemas-microsoft-com:office:word":"office-word"};function read(xmlString){return xml.readString(xmlString,xmlNamespaceMap).then(function(document){return collapseAlternateContent(document)[0];});}
function readXmlFromZipFile(docxFile,path){if(docxFile.exists(path)){return docxFile.read(path,"utf-8").then(stripUtf8Bom).then(read);}else{return promises.resolve(null);}}
function stripUtf8Bom(xmlString){return xmlString.replace(/^\uFEFF/g,'');}
function collapseAlternateContent(node){if(node.type==="element"){if(node.name==="mc:AlternateContent"){return node.first("mc:Fallback").children;}else{node.children=_.flatten(node.children.map(collapseAlternateContent,true));return[node];}}else{return[node];}}},{"../promises":23,"../xml":34,"underscore":153}],13:[function(require,module,exports){exports.readRelationships=readRelationships;exports.defaultValue=new Relationships([]);exports.Relationships=Relationships;function readRelationships(element){var relationships=[];element.children.forEach(function(child){if(child.name==="{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"){var relationship={relationshipId:child.attributes.Id,target:child.attributes.Target,type:child.attributes.Type};relationships.push(relationship);}});return new Relationships(relationships);}
function Relationships(relationships){var targetsByRelationshipId={};relationships.forEach(function(relationship){targetsByRelationshipId[relationship.relationshipId]=relationship.target;});var targetsByType={};relationships.forEach(function(relationship){if(!targetsByType[relationship.type]){targetsByType[relationship.type]=[];}
targetsByType[relationship.type].push(relationship.target);});return{findTargetByRelationshipId:function(relationshipId){return targetsByRelationshipId[relationshipId];},findTargetsByType:function(type){return targetsByType[type]||[];}};}},{}],14:[function(require,module,exports){var _=require("underscore");var promises=require("../promises");var xml=require("../xml");exports.writeStyleMap=writeStyleMap;exports.readStyleMap=readStyleMap;var schema="http://schemas.zwobble.org/mammoth/style-map";var styleMapPath="mammoth/style-map";var styleMapAbsolutePath="/"+styleMapPath;function writeStyleMap(docxFile,styleMap){docxFile.write(styleMapPath,styleMap);return updateRelationships(docxFile).then(function(){return updateContentTypes(docxFile);});}
function updateRelationships(docxFile){var path="word/_rels/document.xml.rels";var relationshipsUri="http://schemas.openxmlformats.org/package/2006/relationships";var relationshipElementName="{"+relationshipsUri+"}Relationship";return docxFile.read(path,"utf8").then(xml.readString).then(function(relationshipsContainer){var relationships=relationshipsContainer.children;addOrUpdateElement(relationships,relationshipElementName,"Id",{"Id":"rMammothStyleMap","Type":schema,"Target":styleMapAbsolutePath});var namespaces={"":relationshipsUri};return docxFile.write(path,xml.writeString(relationshipsContainer,namespaces));});}
function updateContentTypes(docxFile){var path="[Content_Types].xml";var contentTypesUri="http://schemas.openxmlformats.org/package/2006/content-types";var overrideName="{"+contentTypesUri+"}Override";return docxFile.read(path,"utf8").then(xml.readString).then(function(typesElement){var children=typesElement.children;addOrUpdateElement(children,overrideName,"PartName",{"PartName":styleMapAbsolutePath,"ContentType":"text/prs.mammoth.style-map"});var namespaces={"":contentTypesUri};return docxFile.write(path,xml.writeString(typesElement,namespaces));});}
function addOrUpdateElement(elements,name,identifyingAttribute,attributes){var existingElement=_.find(elements,function(element){return element.name===name&&element.attributes[identifyingAttribute]===attributes[identifyingAttribute];});if(existingElement){existingElement.attributes=attributes;}else{elements.push(xml.element(name,attributes));}}
function readStyleMap(docxFile){if(docxFile.exists(styleMapPath)){return docxFile.read(styleMapPath,"utf8");}else{return promises.resolve(null);}}},{"../promises":23,"../xml":34,"underscore":153}],15:[function(require,module,exports){exports.readStylesXml=readStylesXml;exports.Styles=Styles;exports.defaultStyles=new Styles({},{});function Styles(paragraphStyles,characterStyles,tableStyles,numberingStyles){return{findParagraphStyleById:function(styleId){return paragraphStyles[styleId];},findCharacterStyleById:function(styleId){return characterStyles[styleId];},findTableStyleById:function(styleId){return tableStyles[styleId];},findNumberingStyleById:function(styleId){return numberingStyles[styleId];}};}
Styles.EMPTY=new Styles({},{},{},{});function readStylesXml(root){var paragraphStyles={};var characterStyles={};var tableStyles={};var numberingStyles={};var styles={"paragraph":paragraphStyles,"character":characterStyles,"table":tableStyles};root.getElementsByTagName("w:style").forEach(function(styleElement){var style=readStyleElement(styleElement);if(style.type==="numbering"){numberingStyles[style.styleId]=readNumberingStyleElement(styleElement);}else{var styleSet=styles[style.type];if(styleSet){styleSet[style.styleId]=style;}}});return new Styles(paragraphStyles,characterStyles,tableStyles,numberingStyles);}
function readStyleElement(styleElement){var type=styleElement.attributes["w:type"];var styleId=styleElement.attributes["w:styleId"];var name=styleName(styleElement);return{type:type,styleId:styleId,name:name};}
function styleName(styleElement){var nameElement=styleElement.first("w:name");return nameElement?nameElement.attributes["w:val"]:null;}
function readNumberingStyleElement(styleElement){var numId=styleElement.firstOrEmpty("w:pPr").firstOrEmpty("w:numPr").firstOrEmpty("w:numId").attributes["w:val"];return{numId:numId};}},{}],16:[function(require,module,exports){exports.uriToZipEntryName=uriToZipEntryName;exports.replaceFragment=replaceFragment;function uriToZipEntryName(base,uri){if(uri.charAt(0)==="/"){return uri.substr(1);}else{return base+"/"+uri;}}
function replaceFragment(uri,fragment){var hashIndex=uri.indexOf("#");if(hashIndex!==-1){uri=uri.substring(0,hashIndex);}
return uri+"#"+fragment;}},{}],17:[function(require,module,exports){var htmlPaths=require("../styles/html-paths");function nonFreshElement(tagName,attributes,children){return elementWithTag(htmlPaths.element(tagName,attributes,{fresh:false}),children);}
function freshElement(tagName,attributes,children){var tag=htmlPaths.element(tagName,attributes,{fresh:true});return elementWithTag(tag,children);}
function elementWithTag(tag,children){return{type:"element",tag:tag,children:children||[]};}
function text(value){return{type:"text",value:value};}
var forceWrite={type:"forceWrite"};exports.freshElement=freshElement;exports.nonFreshElement=nonFreshElement;exports.elementWithTag=elementWithTag;exports.text=text;exports.forceWrite=forceWrite;var voidTagNames={"br":true,"hr":true,"img":true};function isVoidElement(node){return(node.children.length===0)&&voidTagNames[node.tag.tagName];}
exports.isVoidElement=isVoidElement;},{"../styles/html-paths":27}],18:[function(require,module,exports){var ast=require("./ast");exports.freshElement=ast.freshElement;exports.nonFreshElement=ast.nonFreshElement;exports.elementWithTag=ast.elementWithTag;exports.text=ast.text;exports.forceWrite=ast.forceWrite;exports.simplify=require("./simplify");function write(writer,nodes){nodes.forEach(function(node){writeNode(writer,node);});}
function writeNode(writer,node){toStrings[node.type](writer,node);}
var toStrings={element:generateElementString,text:generateTextString,forceWrite:function(){}};function generateElementString(writer,node){if(ast.isVoidElement(node)){writer.selfClosing(node.tag.tagName,node.tag.attributes);}else{writer.open(node.tag.tagName,node.tag.attributes);write(writer,node.children);writer.close(node.tag.tagName);}}
function generateTextString(writer,node){writer.text(node.value);}
exports.write=write;},{"./ast":17,"./simplify":19}],19:[function(require,module,exports){var _=require("underscore");var ast=require("./ast");function simplify(nodes){return collapse(removeEmpty(nodes));}
function collapse(nodes){var children=[];nodes.map(collapseNode).forEach(function(child){appendChild(children,child);});return children;}
function collapseNode(node){return collapsers[node.type](node);}
var collapsers={element:collapseElement,text:identity,forceWrite:identity};function collapseElement(node){return ast.elementWithTag(node.tag,collapse(node.children));}
function identity(value){return value;}
function appendChild(children,child){var lastChild=children[children.length-1];if(child.type==="element"&&!child.tag.fresh&&lastChild&&lastChild.type==="element"&&child.tag.matchesElement(lastChild.tag)){if(child.tag.separator){appendChild(lastChild.children,ast.text(child.tag.separator));}
child.children.forEach(function(grandChild){appendChild(lastChild.children,grandChild);});}else{children.push(child);}}
function removeEmpty(nodes){return flatMap(nodes,function(node){return emptiers[node.type](node);});}
function flatMap(values,func){return _.flatten(_.map(values,func),true);}
var emptiers={element:elementEmptier,text:textEmptier,forceWrite:neverEmpty};function neverEmpty(node){return[node];}
function elementEmptier(element){var children=removeEmpty(element.children);if(children.length===0&&!ast.isVoidElement(element)){return[];}else{return[ast.elementWithTag(element.tag,children)];}}
function textEmptier(node){if(node.value.length===0){return[];}else{return[node];}}
module.exports=simplify;},{"./ast":17,"underscore":153}],20:[function(require,module,exports){var _=require("underscore");var promises=require("./promises");var Html=require("./html");exports.imgElement=imgElement;function imgElement(func){return function(element,messages){return promises.when(func(element)).then(function(result){var attributes=_.clone(result);if(element.altText){attributes.alt=element.altText;}
return[Html.freshElement("img",attributes)];});};}
exports.inline=exports.imgElement;exports.dataUri=imgElement(function(element){return element.read("base64").then(function(imageBuffer){return{src:"data:"+element.contentType+";base64,"+imageBuffer};});});},{"./html":18,"./promises":23,"underscore":153}],21:[function(require,module,exports){var _=require("underscore");var docxReader=require("./docx/docx-reader");var docxStyleMap=require("./docx/style-map");var DocumentConverter=require("./document-to-html").DocumentConverter;var readStyle=require("./style-reader").readStyle;var readOptions=require("./options-reader").readOptions;var unzip=require("./unzip");var Result=require("./results").Result;exports.convertToHtml=convertToHtml;exports.convertToMarkdown=convertToMarkdown;exports.convert=convert;exports.extractRawText=extractRawText;exports.images=require("./images");exports.transforms=require("./transforms");exports.underline=require("./underline");exports.embedStyleMap=embedStyleMap;exports.readEmbeddedStyleMap=readEmbeddedStyleMap;function convertToHtml(input,options){return convert(input,options);}
function convertToMarkdown(input,options){var markdownOptions=Object.create(options||{});markdownOptions.outputFormat="markdown";return convert(input,markdownOptions);}
function convert(input,options){options=readOptions(options);return unzip.openZip(input).tap(function(docxFile){return docxStyleMap.readStyleMap(docxFile).then(function(styleMap){options.embeddedStyleMap=styleMap;});}).then(function(docxFile){return docxReader.read(docxFile,input).then(function(documentResult){return documentResult.map(options.transformDocument);}).then(function(documentResult){return convertDocumentToHtml(documentResult,options);});});}
function readEmbeddedStyleMap(input){return unzip.openZip(input).then(docxStyleMap.readStyleMap);}
function convertDocumentToHtml(documentResult,options){var styleMapResult=parseStyleMap(options.readStyleMap());var parsedOptions=_.extend({},options,{styleMap:styleMapResult.value});var documentConverter=new DocumentConverter(parsedOptions);return documentResult.flatMapThen(function(document){return styleMapResult.flatMapThen(function(styleMap){return documentConverter.convertToHtml(document);});});}
function parseStyleMap(styleMap){return Result.combine((styleMap||[]).map(readStyle)).map(function(styleMap){return styleMap.filter(function(styleMapping){return!!styleMapping;});});}
function extractRawText(input){return unzip.openZip(input).then(docxReader.read).then(function(documentResult){return documentResult.map(convertElementToRawText);});}
function convertElementToRawText(element){if(element.type==="text"){return element.value;}else{var tail=element.type==="paragraph"?"\n\n":"";return(element.children||[]).map(convertElementToRawText).join("")+tail;}}
function embedStyleMap(input,styleMap){return unzip.openZip(input).tap(function(docxFile){return docxStyleMap.writeStyleMap(docxFile,styleMap);}).then(function(docxFile){return{toBuffer:docxFile.toBuffer};});}
exports.styleMapping=function(){throw new Error('Use a raw string instead of mammoth.styleMapping e.g. "p[style-name=\'Title\'] => h1" instead of mammoth.styleMapping("p[style-name=\'Title\'] => h1")');};},{"./document-to-html":3,"./docx/docx-reader":9,"./docx/style-map":14,"./images":20,"./options-reader":22,"./results":24,"./style-reader":25,"./transforms":29,"./underline":30,"./unzip":2,"underscore":153}],22:[function(require,module,exports){exports.readOptions=readOptions;var _=require("underscore");var defaultStyleMap=exports._defaultStyleMap=["p.Heading1 => h1:fresh","p.Heading2 => h2:fresh","p.Heading3 => h3:fresh","p.Heading4 => h4:fresh","p.Heading5 => h5:fresh","p.Heading6 => h6:fresh","p[style-name='Heading 1'] => h1:fresh","p[style-name='Heading 2'] => h2:fresh","p[style-name='Heading 3'] => h3:fresh","p[style-name='Heading 4'] => h4:fresh","p[style-name='Heading 5'] => h5:fresh","p[style-name='Heading 6'] => h6:fresh","p[style-name='heading 1'] => h1:fresh","p[style-name='heading 2'] => h2:fresh","p[style-name='heading 3'] => h3:fresh","p[style-name='heading 4'] => h4:fresh","p[style-name='heading 5'] => h5:fresh","p[style-name='heading 6'] => h6:fresh","r[style-name='Strong'] => strong","p[style-name='footnote text'] => p:fresh","r[style-name='footnote reference'] =>","p[style-name='endnote text'] => p:fresh","r[style-name='endnote reference'] =>","p[style-name='annotation text'] => p:fresh","r[style-name='annotation reference'] =>","p[style-name='Footnote'] => p:fresh","r[style-name='Footnote anchor'] =>","p[style-name='Endnote'] => p:fresh","r[style-name='Endnote anchor'] =>","p:unordered-list(1) => ul > li:fresh","p:unordered-list(2) => ul|ol > li > ul > li:fresh","p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh","p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh","p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh","p:ordered-list(1) => ol > li:fresh","p:ordered-list(2) => ul|ol > li > ol > li:fresh","p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh","p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh","p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh","r[style-name='Hyperlink'] =>","p[style-name='Normal'] => p:fresh"];var standardOptions=exports._standardOptions={transformDocument:identity,includeDefaultStyleMap:true,includeEmbeddedStyleMap:true};function readOptions(options){options=options||{};return _.extend({},standardOptions,options,{customStyleMap:readStyleMap(options.styleMap),readStyleMap:function(){var styleMap=this.customStyleMap;if(this.includeEmbeddedStyleMap){styleMap=styleMap.concat(readStyleMap(this.embeddedStyleMap));}
if(this.includeDefaultStyleMap){styleMap=styleMap.concat(defaultStyleMap);}
return styleMap;}});}
function readStyleMap(styleMap){if(!styleMap){return[];}else if(_.isString(styleMap)){return styleMap.split("\n").map(function(line){return line.trim();}).filter(function(line){return line!==""&&line.charAt(0)!=="#";});}else{return styleMap;}}
function identity(value){return value;}},{"underscore":153}],23:[function(require,module,exports){var _=require("underscore");var bluebird=require("bluebird/js/release/promise")();exports.defer=defer;exports.when=bluebird.resolve;exports.resolve=bluebird.resolve;exports.all=bluebird.all;exports.props=bluebird.props;exports.reject=bluebird.reject;exports.promisify=bluebird.promisify;exports.mapSeries=bluebird.mapSeries;exports.attempt=bluebird.attempt;exports.nfcall=function(func){var args=Array.prototype.slice.call(arguments,1);var promisedFunc=bluebird.promisify(func);return promisedFunc.apply(null,args);};bluebird.prototype.fail=bluebird.prototype.caught;bluebird.prototype.also=function(func){return this.then(function(value){var returnValue=_.extend({},value,func(value));return bluebird.props(returnValue);});};function defer(){var resolve;var reject;var promise=new bluebird.Promise(function(resolveArg,rejectArg){resolve=resolveArg;reject=rejectArg;});return{resolve:resolve,reject:reject,promise:promise};}},{"bluebird/js/release/promise":60,"underscore":153}],24:[function(require,module,exports){var _=require("underscore");exports.Result=Result;exports.success=success;exports.warning=warning;exports.error=error;function Result(value,messages){this.value=value;this.messages=messages||[];}
Result.prototype.map=function(func){return new Result(func(this.value),this.messages);};Result.prototype.flatMap=function(func){var funcResult=func(this.value);return new Result(funcResult.value,combineMessages([this,funcResult]));};Result.prototype.flatMapThen=function(func){var that=this;return func(this.value).then(function(otherResult){return new Result(otherResult.value,combineMessages([that,otherResult]));});};Result.combine=function(results){var values=_.flatten(_.pluck(results,"value"));var messages=combineMessages(results);return new Result(values,messages);};function success(value){return new Result(value,[]);}
function warning(message){return{type:"warning",message:message};}
function error(exception){return{type:"error",message:exception.message,error:exception};}
function combineMessages(results){var messages=[];_.flatten(_.pluck(results,"messages"),true).forEach(function(message){if(!containsMessage(messages,message)){messages.push(message);}});return messages;}
function containsMessage(messages,message){return _.find(messages,isSameMessage.bind(null,message))!==undefined;}
function isSameMessage(first,second){return first.type===second.type&&first.message===second.message;}},{"underscore":153}],25:[function(require,module,exports){var _=require("underscore");var lop=require("lop");var documentMatchers=require("./styles/document-matchers");var htmlPaths=require("./styles/html-paths");var tokenise=require("./styles/parser/tokeniser").tokenise;var results=require("./results");exports.readHtmlPath=readHtmlPath;exports.readDocumentMatcher=readDocumentMatcher;exports.readStyle=readStyle;function readStyle(string){return parseString(styleRule,string);}
function createStyleRule(){return lop.rules.sequence(lop.rules.sequence.capture(documentMatcherRule()),lop.rules.tokenOfType("whitespace"),lop.rules.tokenOfType("arrow"),lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("whitespace"),lop.rules.sequence.capture(htmlPathRule())).head())),lop.rules.tokenOfType("end")).map(function(documentMatcher,htmlPath){return{from:documentMatcher,to:htmlPath.valueOrElse(htmlPaths.empty)};});}
function readDocumentMatcher(string){return parseString(documentMatcherRule(),string);}
function documentMatcherRule(){var sequence=lop.rules.sequence;var identifierToConstant=function(identifier,constant){return lop.rules.then(lop.rules.token("identifier",identifier),function(){return constant;});};var paragraphRule=identifierToConstant("p",documentMatchers.paragraph);var runRule=identifierToConstant("r",documentMatchers.run);var elementTypeRule=lop.rules.firstOf("p or r or table",paragraphRule,runRule);var styleIdRule=lop.rules.then(classRule,function(styleId){return{styleId:styleId};});var styleNameMatcherRule=lop.rules.firstOf("style name matcher",lop.rules.then(lop.rules.sequence(lop.rules.tokenOfType("equals"),lop.rules.sequence.cut(),lop.rules.sequence.capture(stringRule)).head(),function(styleName){return{styleName:documentMatchers.equalTo(styleName)};}),lop.rules.then(lop.rules.sequence(lop.rules.tokenOfType("startsWith"),lop.rules.sequence.cut(),lop.rules.sequence.capture(stringRule)).head(),function(styleName){return{styleName:documentMatchers.startsWith(styleName)};}));var styleNameRule=lop.rules.sequence(lop.rules.tokenOfType("open-square-bracket"),lop.rules.sequence.cut(),lop.rules.token("identifier","style-name"),lop.rules.sequence.capture(styleNameMatcherRule),lop.rules.tokenOfType("close-square-bracket")).head();var listTypeRule=lop.rules.firstOf("list type",identifierToConstant("ordered-list",{isOrdered:true}),identifierToConstant("unordered-list",{isOrdered:false}));var listRule=sequence(lop.rules.tokenOfType("colon"),sequence.capture(listTypeRule),sequence.cut(),lop.rules.tokenOfType("open-paren"),sequence.capture(integerRule),lop.rules.tokenOfType("close-paren")).map(function(listType,levelNumber){return{list:{isOrdered:listType.isOrdered,levelIndex:levelNumber-1}};});function createMatcherSuffixesRule(rules){var matcherSuffix=lop.rules.firstOf.apply(lop.rules.firstOf,["matcher suffix"].concat(rules));var matcherSuffixes=lop.rules.zeroOrMore(matcherSuffix);return lop.rules.then(matcherSuffixes,function(suffixes){var matcherOptions={};suffixes.forEach(function(suffix){_.extend(matcherOptions,suffix);});return matcherOptions;});}
var paragraphOrRun=sequence(sequence.capture(elementTypeRule),sequence.capture(createMatcherSuffixesRule([styleIdRule,styleNameRule,listRule]))).map(function(createMatcher,matcherOptions){return createMatcher(matcherOptions);});var table=sequence(lop.rules.token("identifier","table"),sequence.capture(createMatcherSuffixesRule([styleIdRule,styleNameRule]))).map(function(options){return documentMatchers.table(options);});var bold=identifierToConstant("b",documentMatchers.bold);var italic=identifierToConstant("i",documentMatchers.italic);var underline=identifierToConstant("u",documentMatchers.underline);var strikethrough=identifierToConstant("strike",documentMatchers.strikethrough);var smallCaps=identifierToConstant("small-caps",documentMatchers.smallCaps);var commentReference=identifierToConstant("comment-reference",documentMatchers.commentReference);var breakMatcher=sequence(lop.rules.token("identifier","br"),sequence.cut(),lop.rules.tokenOfType("open-square-bracket"),lop.rules.token("identifier","type"),lop.rules.tokenOfType("equals"),sequence.capture(stringRule),lop.rules.tokenOfType("close-square-bracket")).map(function(breakType){switch(breakType){case "line":return documentMatchers.lineBreak;case "page":return documentMatchers.pageBreak;case "column":return documentMatchers.columnBreak;default:}});return lop.rules.firstOf("element type",paragraphOrRun,table,bold,italic,underline,strikethrough,smallCaps,commentReference,breakMatcher);}
function readHtmlPath(string){return parseString(htmlPathRule(),string);}
function htmlPathRule(){var capture=lop.rules.sequence.capture;var whitespaceRule=lop.rules.tokenOfType("whitespace");var freshRule=lop.rules.then(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("colon"),lop.rules.token("identifier","fresh"))),function(option){return option.map(function(){return true;}).valueOrElse(false);});var separatorRule=lop.rules.then(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("colon"),lop.rules.token("identifier","separator"),lop.rules.tokenOfType("open-paren"),capture(stringRule),lop.rules.tokenOfType("close-paren")).head()),function(option){return option.valueOrElse("");});var tagNamesRule=lop.rules.oneOrMoreWithSeparator(identifierRule,lop.rules.tokenOfType("choice"));var styleElementRule=lop.rules.sequence(capture(tagNamesRule),capture(lop.rules.zeroOrMore(classRule)),capture(freshRule),capture(separatorRule)).map(function(tagName,classNames,fresh,separator){var attributes={};var options={};if(classNames.length>0){attributes["class"]=classNames.join(" ");}
if(fresh){options.fresh=true;}
if(separator){options.separator=separator;}
return htmlPaths.element(tagName,attributes,options);});return lop.rules.firstOf("html path",lop.rules.then(lop.rules.tokenOfType("bang"),function(){return htmlPaths.ignore;}),lop.rules.then(lop.rules.zeroOrMoreWithSeparator(styleElementRule,lop.rules.sequence(whitespaceRule,lop.rules.tokenOfType("gt"),whitespaceRule)),htmlPaths.elements));}
var identifierRule=lop.rules.then(lop.rules.tokenOfType("identifier"),decodeEscapeSequences);var integerRule=lop.rules.tokenOfType("integer");var stringRule=lop.rules.then(lop.rules.tokenOfType("string"),decodeEscapeSequences);var escapeSequences={"n":"\n","r":"\r","t":"\t"};function decodeEscapeSequences(value){return value.replace(/\\(.)/g,function(match,code){return escapeSequences[code]||code;});}
var classRule=lop.rules.sequence(lop.rules.tokenOfType("dot"),lop.rules.sequence.cut(),lop.rules.sequence.capture(identifierRule)).head();function parseString(rule,string){var tokens=tokenise(string);var parser=lop.Parser();var parseResult=parser.parseTokens(rule,tokens);if(parseResult.isSuccess()){return results.success(parseResult.value());}else{return new results.Result(null,[results.warning(describeFailure(string,parseResult))]);}}
function describeFailure(input,parseResult){return "Did not understand this style mapping, so ignored it: "+input+"\n"+
parseResult.errors().map(describeError).join("\n");}
function describeError(error){return "Error was at character number "+error.characterNumber()+": "+
"Expected "+error.expected+" but got "+error.actual;}
var styleRule=createStyleRule();},{"./results":24,"./styles/document-matchers":26,"./styles/html-paths":27,"./styles/parser/tokeniser":28,"lop":107,"underscore":153}],26:[function(require,module,exports){exports.paragraph=paragraph;exports.run=run;exports.table=table;exports.bold=new Matcher("bold");exports.italic=new Matcher("italic");exports.underline=new Matcher("underline");exports.strikethrough=new Matcher("strikethrough");exports.smallCaps=new Matcher("smallCaps");exports.commentReference=new Matcher("commentReference");exports.lineBreak=new Matcher("break",{breakType:"line"});exports.pageBreak=new Matcher("break",{breakType:"page"});exports.columnBreak=new Matcher("break",{breakType:"column"});exports.equalTo=equalTo;exports.startsWith=startsWith;function paragraph(options){return new Matcher("paragraph",options);}
function run(options){return new Matcher("run",options);}
function table(options){return new Matcher("table",options);}
function Matcher(elementType,options){options=options||{};this._elementType=elementType;this._styleId=options.styleId;this._styleName=options.styleName;if(options.list){this._listIndex=options.list.levelIndex;this._listIsOrdered=options.list.isOrdered;}}
Matcher.prototype.matches=function(element){return element.type===this._elementType&&(this._styleId===undefined||element.styleId===this._styleId)&&(this._styleName===undefined||(element.styleName&&this._styleName.operator(this._styleName.operand,element.styleName)))&&(this._listIndex===undefined||isList(element,this._listIndex,this._listIsOrdered))&&(this._breakType===undefined||this._breakType===element.breakType);};function isList(element,levelIndex,isOrdered){return element.numbering&&element.numbering.level==levelIndex&&element.numbering.isOrdered==isOrdered;}
function equalTo(value){return{operator:operatorEqualTo,operand:value};}
function startsWith(value){return{operator:operatorStartsWith,operand:value};}
function operatorEqualTo(first,second){return first.toUpperCase()===second.toUpperCase();}
function operatorStartsWith(first,second){return second.toUpperCase().indexOf(first.toUpperCase())===0;}},{}],27:[function(require,module,exports){var _=require("underscore");var html=require("../html");exports.topLevelElement=topLevelElement;exports.elements=elements;exports.element=element;function topLevelElement(tagName,attributes){return elements([element(tagName,attributes,{fresh:true})]);}
function elements(elementStyles){return new HtmlPath(elementStyles.map(function(elementStyle){if(_.isString(elementStyle)){return element(elementStyle);}else{return elementStyle;}}));}
function HtmlPath(elements){this._elements=elements;}
HtmlPath.prototype.wrap=function wrap(children){var result=children();for(var index=this._elements.length-1;index>=0;index--){result=this._elements[index].wrapNodes(result);}
return result;};function element(tagName,attributes,options){options=options||{};return new Element(tagName,attributes,options);}
function Element(tagName,attributes,options){var tagNames={};if(_.isArray(tagName)){tagName.forEach(function(tagName){tagNames[tagName]=true;});tagName=tagName[0];}else{tagNames[tagName]=true;}
this.tagName=tagName;this.tagNames=tagNames;this.attributes=attributes||{};this.fresh=options.fresh;this.separator=options.separator;}
Element.prototype.matchesElement=function(element){return this.tagNames[element.tagName]&&_.isEqual(this.attributes||{},element.attributes||{});};Element.prototype.wrap=function wrap(generateNodes){return this.wrapNodes(generateNodes());};Element.prototype.wrapNodes=function wrapNodes(nodes){return[html.elementWithTag(this,nodes)];};exports.empty=elements([]);exports.ignore={wrap:function(){return[];}};},{"../html":18,"underscore":153}],28:[function(require,module,exports){var lop=require("lop");var RegexTokeniser=lop.RegexTokeniser;exports.tokenise=tokenise;var stringPrefix="'((?:\\\\.|[^'])*)";function tokenise(string){var identifierCharacter="(?:[a-zA-Z\\-_]|\\\\.)";var tokeniser=new RegexTokeniser([{name:"identifier",regex:new RegExp("("+identifierCharacter+"(?:"+identifierCharacter+"|[0-9])*)")},{name:"dot",regex:/\./},{name:"colon",regex:/:/},{name:"gt",regex:/>/},{name:"whitespace",regex:/\s+/},{name:"arrow",regex:/=>/},{name:"equals",regex:/=/},{name:"startsWith",regex:/\^=/},{name:"open-paren",regex:/\(/},{name:"close-paren",regex:/\)/},{name:"open-square-bracket",regex:/\[/},{name:"close-square-bracket",regex:/\]/},{name:"string",regex:new RegExp(stringPrefix+"'")},{name:"unterminated-string",regex:new RegExp(stringPrefix)},{name:"integer",regex:/([0-9]+)/},{name:"choice",regex:/\|/},{name:"bang",regex:/(!)/}]);return tokeniser.tokenise(string);}},{"lop":107}],29:[function(require,module,exports){var _=require("underscore");exports.paragraph=paragraph;exports.run=run;exports._elements=elements;exports.getDescendantsOfType=getDescendantsOfType;exports.getDescendants=getDescendants;function paragraph(transform){return elementsOfType("paragraph",transform);}
function run(transform){return elementsOfType("run",transform);}
function elementsOfType(elementType,transform){return elements(function(element){if(element.type===elementType){return transform(element);}else{return element;}});}
function elements(transform){return function transformElement(element){if(element.children){var children=_.map(element.children,transformElement);element=_.extend(element,{children:children});}
return transform(element);};}
function getDescendantsOfType(element,type){return getDescendants(element).filter(function(descendant){return descendant.type===type;});}
function getDescendants(element){var descendants=[];visitDescendants(element,function(descendant){descendants.push(descendant);});return descendants;}
function visitDescendants(element,visit){if(element.children){element.children.forEach(function(child){visitDescendants(child,visit);visit(child);});}}},{"underscore":153}],30:[function(require,module,exports){var htmlPaths=require("./styles/html-paths");var Html=require("./html");exports.element=element;function element(name){return function(html){return Html.elementWithTag(htmlPaths.element(name),[html]);};}},{"./html":18,"./styles/html-paths":27}],31:[function(require,module,exports){var util=require("util");var _=require("underscore");exports.writer=writer;function writer(options){options=options||{};if(options.prettyPrint){return prettyWriter();}else{return simpleWriter();}}
var indentedElements={div:true,p:true,ul:true,li:true};function prettyWriter(){var indentationLevel=0;var indentation="  ";var stack=[];var start=true;var inText=false;var writer=simpleWriter();function open(tagName,attributes){if(indentedElements[tagName]){indent();}
stack.push(tagName);writer.open(tagName,attributes);if(indentedElements[tagName]){indentationLevel++;}
start=false;}
function close(tagName){if(indentedElements[tagName]){indentationLevel--;indent();}
stack.pop();writer.close(tagName);}
function text(value){startText();var text=isInPre()?value:value.replace("\n","\n"+indentation);writer.text(text);}
function selfClosing(tagName,attributes){indent();writer.selfClosing(tagName,attributes);}
function insideIndentedElement(){return stack.length===0||indentedElements[stack[stack.length-1]];}
function startText(){if(!inText){indent();inText=true;}}
function indent(){inText=false;if(!start&&insideIndentedElement()&&!isInPre()){writer._append("\n");for(var i=0;i<indentationLevel;i++){writer._append(indentation);}}}
function isInPre(){return _.some(stack,function(tagName){return tagName==="pre";});}
return{asString:writer.asString,open:open,close:close,text:text,selfClosing:selfClosing};}
function simpleWriter(){var fragments=[];function open(tagName,attributes){var attributeString=generateAttributeString(attributes);fragments.push(util.format("<%s%s>",tagName,attributeString));}
function close(tagName){fragments.push(util.format("</%s>",tagName));}
function selfClosing(tagName,attributes){var attributeString=generateAttributeString(attributes);fragments.push(util.format("<%s%s />",tagName,attributeString));}
function generateAttributeString(attributes){return _.map(attributes,function(value,key){return util.format(' %s="%s"',key,escapeHtmlAttribute(value));}).join("");}
function text(value){fragments.push(escapeHtmlText(value));}
function append(html){fragments.push(html);}
function asString(){return fragments.join("");}
return{asString:asString,open:open,close:close,text:text,selfClosing:selfClosing,_append:append};}
function escapeHtmlText(value){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escapeHtmlAttribute(value){return value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}},{"underscore":153,"util":157}],32:[function(require,module,exports){var htmlWriter=require("./html-writer");var markdownWriter=require("./markdown-writer");exports.writer=writer;function writer(options){options=options||{};if(options.outputFormat==="markdown"){return markdownWriter.writer();}else{return htmlWriter.writer(options);}}},{"./html-writer":31,"./markdown-writer":33}],33:[function(require,module,exports){var _=require("underscore");function symmetricMarkdownElement(end){return markdownElement(end,end);}
function markdownElement(start,end){return function(){return{start:start,end:end};};}
function markdownLink(attributes){var href=attributes.href||"";if(href){return{start:"[",end:"]("+href+")",anchorPosition:"before"};}else{return{};}}
function markdownImage(attributes){var src=attributes.src||"";var altText=attributes.alt||"";if(src||altText){return{start:"!["+altText+"]("+src+")"};}else{return{};}}
function markdownList(options){return function(attributes,list){return{start:list?"\n":"",end:list?"":"\n",list:{isOrdered:options.isOrdered,indent:list?list.indent+1:0,count:0}};};}
function markdownListItem(attributes,list,listItem){list=list||{indent:0,isOrdered:false,count:0};list.count++;listItem.hasClosed=false;var bullet=list.isOrdered?list.count+".":"-";var start=repeatString("\t",list.indent)+bullet+" ";return{start:start,end:function(){if(!listItem.hasClosed){listItem.hasClosed=true;return "\n";}}};}
var htmlToMarkdown={"p":markdownElement("","\n\n"),"br":markdownElement("","  \n"),"ul":markdownList({isOrdered:false}),"ol":markdownList({isOrdered:true}),"li":markdownListItem,"strong":symmetricMarkdownElement("__"),"em":symmetricMarkdownElement("*"),"a":markdownLink,"img":markdownImage};(function(){for(var i=1;i<=6;i++){htmlToMarkdown["h"+i]=markdownElement(repeatString("#",i)+" ","\n\n");}})();function repeatString(value,count){return new Array(count+1).join(value);}
function markdownWriter(){var fragments=[];var elementStack=[];var list=null;var listItem={};function open(tagName,attributes){attributes=attributes||{};var createElement=htmlToMarkdown[tagName]||function(){return{};};var element=createElement(attributes,list,listItem);elementStack.push({end:element.end,list:list});if(element.list){list=element.list;}
var anchorBeforeStart=element.anchorPosition==="before";if(anchorBeforeStart){writeAnchor(attributes);}
fragments.push(element.start||"");if(!anchorBeforeStart){writeAnchor(attributes);}}
function writeAnchor(attributes){if(attributes.id){fragments.push('<a id="'+attributes.id+'"></a>');}}
function close(tagName){var element=elementStack.pop();list=element.list;var end=_.isFunction(element.end)?element.end():element.end;fragments.push(end||"");}
function selfClosing(tagName,attributes){open(tagName,attributes);close(tagName);}
function text(value){fragments.push(escapeMarkdown(value));}
function asString(){return fragments.join("");}
return{asString:asString,open:open,close:close,text:text,selfClosing:selfClosing};}
exports.writer=markdownWriter;function escapeMarkdown(value){return value.replace(/\\/g,'\\\\').replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g,'\\$1');}},{"underscore":153}],34:[function(require,module,exports){var nodes=require("./nodes");exports.Element=nodes.Element;exports.element=nodes.element;exports.text=nodes.text;exports.readString=require("./reader").readString;exports.writeString=require("./writer").writeString;},{"./nodes":35,"./reader":36,"./writer":37}],35:[function(require,module,exports){var _=require("underscore");exports.Element=Element;exports.element=function(name,attributes,children){return new Element(name,attributes,children);};exports.text=function(value){return{type:"text",value:value};};var emptyElement={first:function(){return null;},firstOrEmpty:function(){return emptyElement;},attributes:{}};function Element(name,attributes,children){this.type="element";this.name=name;this.attributes=attributes||{};this.children=children||[];}
Element.prototype.first=function(name){return _.find(this.children,function(child){return child.name===name;});};Element.prototype.firstOrEmpty=function(name){return this.first(name)||emptyElement;};Element.prototype.getElementsByTagName=function(name){var elements=_.filter(this.children,function(child){return child.name===name;});return toElementList(elements);};Element.prototype.text=function(){if(this.children.length===0){return "";}else if(this.children.length!==1||this.children[0].type!=="text"){throw new Error("Not implemented");}
return this.children[0].value;};var elementListPrototype={getElementsByTagName:function(name){return toElementList(_.flatten(this.map(function(element){return element.getElementsByTagName(name);},true)));}};function toElementList(array){return _.extend(array,elementListPrototype);}},{"underscore":153}],36:[function(require,module,exports){var promises=require("../promises");var sax=require("sax");var _=require("underscore");var nodes=require("./nodes");var Element=nodes.Element;exports.readString=readString;function readString(xmlString,namespaceMap){namespaceMap=namespaceMap||{};var finished=false;var parser=sax.parser(true,{xmlns:true,position:false});var rootElement={children:[]};var currentElement=rootElement;var stack=[];var deferred=promises.defer();parser.onopentag=function(node){var attributes=mapObject(node.attributes,function(attribute){return attribute.value;},mapName);var element=new Element(mapName(node),attributes);currentElement.children.push(element);stack.push(currentElement);currentElement=element;};function mapName(node){if(node.uri){var mappedPrefix=namespaceMap[node.uri];var prefix;if(mappedPrefix){prefix=mappedPrefix+":";}else{prefix="{"+node.uri+"}";}
return prefix+node.local;}else{return node.local;}}
parser.onclosetag=function(node){currentElement=stack.pop();};parser.ontext=function(text){if(currentElement!==rootElement){currentElement.children.push(nodes.text(text));}};parser.onend=function(){if(!finished){finished=true;deferred.resolve(rootElement.children[0]);}};parser.onerror=function(error){if(!finished){finished=true;deferred.reject(error);}};parser.write(xmlString).close();return deferred.promise;}
function mapObject(input,valueFunc,keyFunc){return _.reduce(input,function(result,value,key){var mappedKey=keyFunc(value,key,input);result[mappedKey]=valueFunc(value,key,input);return result;},{});}},{"../promises":23,"./nodes":35,"sax":150,"underscore":153}],37:[function(require,module,exports){var _=require("underscore");var xmlbuilder=require("xmlbuilder");exports.writeString=writeString;function writeString(root,namespaces){var uriToPrefix=_.invert(namespaces);var nodeWriters={element:writeElement,text:writeTextNode};function writeNode(builder,node){return nodeWriters[node.type](builder,node);}
function writeElement(builder,element){var elementBuilder=builder.element(mapElementName(element.name),element.attributes);element.children.forEach(function(child){writeNode(elementBuilder,child);});}
function mapElementName(name){var longFormMatch=/^\{(.*)\}(.*)$/.exec(name);if(longFormMatch){var prefix=uriToPrefix[longFormMatch[1]];return prefix+(prefix===""?"":":")+longFormMatch[2];}else{return name;}}
function writeDocument(root){var builder=xmlbuilder.create(mapElementName(root.name),{version:'1.0',encoding:'UTF-8',standalone:true});_.forEach(namespaces,function(uri,prefix){var key="xmlns"+(prefix===""?"":":"+prefix);builder.attribute(key,uri);});root.children.forEach(function(child){writeNode(builder,child);});return builder.end();}
return writeDocument(root);}
function writeTextNode(builder,node){builder.text(node.value);}},{"underscore":153,"xmlbuilder":179}],38:[function(require,module,exports){(function(Buffer){var JSZip=require("jszip");var promises=require("./promises");exports.openArrayBuffer=openArrayBuffer;exports.splitPath=splitPath;exports.joinPath=joinPath;function openArrayBuffer(arrayBuffer){var zipFile=new JSZip(arrayBuffer);function exists(name){return zipFile.file(name)!==null;}
function read(name,encoding){var array=zipFile.file(name).asUint8Array();var buffer=new Buffer(array);if(encoding){return promises.when(buffer.toString(encoding));}else{return promises.when(buffer);}}
function write(name,contents){zipFile.file(name,contents);}
function toBuffer(){return zipFile.generate({type:"nodebuffer"});}
return{exists:exists,read:read,write:write,toBuffer:toBuffer};}
function splitPath(path){var lastIndex=path.lastIndexOf("/");if(lastIndex===-1){return{dirname:"",basename:path};}else{return{dirname:path.substring(0,lastIndex),basename:path.substring(lastIndex+1)};}}
function joinPath(){var nonEmptyPaths=Array.prototype.filter.call(arguments,function(path){return path;});var relevantPaths=[];nonEmptyPaths.forEach(function(path){if(/^\//.test(path)){relevantPaths=[path];}else{relevantPaths.push(path);}});return relevantPaths.join("/");}}).call(this,require("buffer").Buffer)},{"./promises":23,"buffer":77,"jszip":92}],39:[function(require,module,exports){'use strict'
exports.byteLength=byteLength
exports.toByteArray=toByteArray
exports.fromByteArray=fromByteArray
var lookup=[]
var revLookup=[]
var Arr=typeof Uint8Array!=='undefined'?Uint8Array:Array
var code='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for(var i=0,len=code.length;i<len;++i){lookup[i]=code[i]
revLookup[code.charCodeAt(i)]=i}
revLookup['-'.charCodeAt(0)]=62
revLookup['_'.charCodeAt(0)]=63
function placeHoldersCount(b64){var len=b64.length
if(len%4>0){throw new Error('Invalid string. Length must be a multiple of 4')}
return b64[len-2]==='='?2:b64[len-1]==='='?1:0}
function byteLength(b64){return b64.length*3/4-placeHoldersCount(b64)}
function toByteArray(b64){var i,j,l,tmp,placeHolders,arr
var len=b64.length
placeHolders=placeHoldersCount(b64)
arr=new Arr(len*3/4-placeHolders)
l=placeHolders>0?len-4:len
var L=0
for(i=0,j=0;i<l;i+=4,j+=3){tmp=(revLookup[b64.charCodeAt(i)]<<18)|(revLookup[b64.charCodeAt(i+1)]<<12)|(revLookup[b64.charCodeAt(i+2)]<<6)|revLookup[b64.charCodeAt(i+3)]
arr[L++]=(tmp>>16)&0xFF
arr[L++]=(tmp>>8)&0xFF
arr[L++]=tmp&0xFF}
if(placeHolders===2){tmp=(revLookup[b64.charCodeAt(i)]<<2)|(revLookup[b64.charCodeAt(i+1)]>>4)
arr[L++]=tmp&0xFF}else if(placeHolders===1){tmp=(revLookup[b64.charCodeAt(i)]<<10)|(revLookup[b64.charCodeAt(i+1)]<<4)|(revLookup[b64.charCodeAt(i+2)]>>2)
arr[L++]=(tmp>>8)&0xFF
arr[L++]=tmp&0xFF}
return arr}
function tripletToBase64(num){return lookup[num>>18&0x3F]+lookup[num>>12&0x3F]+lookup[num>>6&0x3F]+lookup[num&0x3F]}
function encodeChunk(uint8,start,end){var tmp
var output=[]
for(var i=start;i<end;i+=3){tmp=(uint8[i]<<16)+(uint8[i+1]<<8)+(uint8[i+2])
output.push(tripletToBase64(tmp))}
return output.join('')}
function fromByteArray(uint8){var tmp
var len=uint8.length
var extraBytes=len%3
var output=''
var parts=[]
var maxChunkLength=16383
for(var i=0,len2=len-extraBytes;i<len2;i+=maxChunkLength){parts.push(encodeChunk(uint8,i,(i+maxChunkLength)>len2?len2:(i+maxChunkLength)))}
if(extraBytes===1){tmp=uint8[len-1]
output+=lookup[tmp>>2]
output+=lookup[(tmp<<4)&0x3F]
output+='=='}else if(extraBytes===2){tmp=(uint8[len-2]<<8)+(uint8[len-1])
output+=lookup[tmp>>10]
output+=lookup[(tmp>>4)&0x3F]
output+=lookup[(tmp<<2)&0x3F]
output+='='}
parts.push(output)
return parts.join('')}},{}],40:[function(require,module,exports){"use strict";module.exports=function(Promise){var SomePromiseArray=Promise._SomePromiseArray;function any(promises){var ret=new SomePromiseArray(promises);var promise=ret.promise();ret.setHowMany(1);ret.setUnwrap();ret.init();return promise;}
Promise.any=function(promises){return any(promises);};Promise.prototype.any=function(){return any(this);};};},{}],41:[function(require,module,exports){(function(process){"use strict";var firstLineError;try{throw new Error();}catch(e){firstLineError=e;}
var schedule=require("./schedule");var Queue=require("./queue");var util=require("./util");function Async(){this._customScheduler=false;this._isTickUsed=false;this._lateQueue=new Queue(16);this._normalQueue=new Queue(16);this._haveDrainedQueues=false;this._trampolineEnabled=true;var self=this;this.drainQueues=function(){self._drainQueues();};this._schedule=schedule;}
Async.prototype.setScheduler=function(fn){var prev=this._schedule;this._schedule=fn;this._customScheduler=true;return prev;};Async.prototype.hasCustomScheduler=function(){return this._customScheduler;};Async.prototype.enableTrampoline=function(){this._trampolineEnabled=true;};Async.prototype.disableTrampolineIfNecessary=function(){if(util.hasDevTools){this._trampolineEnabled=false;}};Async.prototype.haveItemsQueued=function(){return this._isTickUsed||this._haveDrainedQueues;};Async.prototype.fatalError=function(e,isNode){if(isNode){process.stderr.write("Fatal "+(e instanceof Error?e.stack:e)+
"\n");process.exit(2);}else{this.throwLater(e);}};Async.prototype.throwLater=function(fn,arg){if(arguments.length===1){arg=fn;fn=function(){throw arg;};}
if(typeof setTimeout!=="undefined"){setTimeout(function(){fn(arg);},0);}else try{this._schedule(function(){fn(arg);});}catch(e){throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}};function AsyncInvokeLater(fn,receiver,arg){this._lateQueue.push(fn,receiver,arg);this._queueTick();}
function AsyncInvoke(fn,receiver,arg){this._normalQueue.push(fn,receiver,arg);this._queueTick();}
function AsyncSettlePromises(promise){this._normalQueue._pushOne(promise);this._queueTick();}
if(!util.hasDevTools){Async.prototype.invokeLater=AsyncInvokeLater;Async.prototype.invoke=AsyncInvoke;Async.prototype.settlePromises=AsyncSettlePromises;}else{Async.prototype.invokeLater=function(fn,receiver,arg){if(this._trampolineEnabled){AsyncInvokeLater.call(this,fn,receiver,arg);}else{this._schedule(function(){setTimeout(function(){fn.call(receiver,arg);},100);});}};Async.prototype.invoke=function(fn,receiver,arg){if(this._trampolineEnabled){AsyncInvoke.call(this,fn,receiver,arg);}else{this._schedule(function(){fn.call(receiver,arg);});}};Async.prototype.settlePromises=function(promise){if(this._trampolineEnabled){AsyncSettlePromises.call(this,promise);}else{this._schedule(function(){promise._settlePromises();});}};}
Async.prototype._drainQueue=function(queue){while(queue.length()>0){var fn=queue.shift();if(typeof fn!=="function"){fn._settlePromises();continue;}
var receiver=queue.shift();var arg=queue.shift();fn.call(receiver,arg);}};Async.prototype._drainQueues=function(){this._drainQueue(this._normalQueue);this._reset();this._haveDrainedQueues=true;this._drainQueue(this._lateQueue);};Async.prototype._queueTick=function(){if(!this._isTickUsed){this._isTickUsed=true;this._schedule(this.drainQueues);}};Async.prototype._reset=function(){this._isTickUsed=false;};module.exports=Async;module.exports.firstLineError=firstLineError;}).call(this,require('_process'))},{"./queue":64,"./schedule":67,"./util":74,"_process":138}],42:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL,tryConvertToPromise,debug){var calledBind=false;var rejectThis=function(_,e){this._reject(e);};var targetRejected=function(e,context){context.promiseRejectionQueued=true;context.bindingPromise._then(rejectThis,rejectThis,null,this,e);};var bindingResolved=function(thisArg,context){if(((this._bitField&50397184)===0)){this._resolveCallback(context.target);}};var bindingRejected=function(e,context){if(!context.promiseRejectionQueued)this._reject(e);};Promise.prototype.bind=function(thisArg){if(!calledBind){calledBind=true;Promise.prototype._propagateFrom=debug.propagateFromFunction();Promise.prototype._boundValue=debug.boundValueFunction();}
var maybePromise=tryConvertToPromise(thisArg);var ret=new Promise(INTERNAL);ret._propagateFrom(this,1);var target=this._target();ret._setBoundTo(maybePromise);if(maybePromise instanceof Promise){var context={promiseRejectionQueued:false,promise:ret,target:target,bindingPromise:maybePromise};target._then(INTERNAL,targetRejected,undefined,ret,context);maybePromise._then(bindingResolved,bindingRejected,undefined,ret,context);ret._setOnCancel(maybePromise);}else{ret._resolveCallback(target);}
return ret;};Promise.prototype._setBoundTo=function(obj){if(obj!==undefined){this._bitField=this._bitField|2097152;this._boundTo=obj;}else{this._bitField=this._bitField&(~2097152);}};Promise.prototype._isBound=function(){return(this._bitField&2097152)===2097152;};Promise.bind=function(thisArg,value){return Promise.resolve(value).bind(thisArg);};};},{}],43:[function(require,module,exports){"use strict";var cr=Object.create;if(cr){var callerCache=cr(null);var getterCache=cr(null);callerCache[" size"]=getterCache[" size"]=0;}
module.exports=function(Promise){var util=require("./util");var canEvaluate=util.canEvaluate;var isIdentifier=util.isIdentifier;var getMethodCaller;var getGetter;if(!false){var makeMethodCaller=function(methodName){return new Function("ensureMethod","                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g,methodName))(ensureMethod);};var makeGetter=function(propertyName){return new Function("obj","                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName",propertyName));};var getCompiled=function(name,compiler,cache){var ret=cache[name];if(typeof ret!=="function"){if(!isIdentifier(name)){return null;}
ret=compiler(name);cache[name]=ret;cache[" size"]++;if(cache[" size"]>512){var keys=Object.keys(cache);for(var i=0;i<256;++i)delete cache[keys[i]];cache[" size"]=keys.length-256;}}
return ret;};getMethodCaller=function(name){return getCompiled(name,makeMethodCaller,callerCache);};getGetter=function(name){return getCompiled(name,makeGetter,getterCache);};}
function ensureMethod(obj,methodName){var fn;if(obj!=null)fn=obj[methodName];if(typeof fn!=="function"){var message="Object "+util.classString(obj)+" has no method '"+
util.toString(methodName)+"'";throw new Promise.TypeError(message);}
return fn;}
function caller(obj){var methodName=this.pop();var fn=ensureMethod(obj,methodName);return fn.apply(obj,this);}
Promise.prototype.call=function(methodName){var $_len=arguments.length;var args=new Array(Math.max($_len-1,0));for(var $_i=1;$_i<$_len;++$_i){args[$_i-1]=arguments[$_i];};if(!false){if(canEvaluate){var maybeCaller=getMethodCaller(methodName);if(maybeCaller!==null){return this._then(maybeCaller,undefined,undefined,args,undefined);}}}
args.push(methodName);return this._then(caller,undefined,undefined,args,undefined);};function namedGetter(obj){return obj[this];}
function indexedGetter(obj){var index=+this;if(index<0)index=Math.max(0,index+obj.length);return obj[index];}
Promise.prototype.get=function(propertyName){var isIndex=(typeof propertyName==="number");var getter;if(!isIndex){if(canEvaluate){var maybeGetter=getGetter(propertyName);getter=maybeGetter!==null?maybeGetter:namedGetter;}else{getter=namedGetter;}}else{getter=indexedGetter;}
return this._then(getter,undefined,undefined,propertyName,undefined);};};},{"./util":74}],44:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,apiRejection,debug){var util=require("./util");var tryCatch=util.tryCatch;var errorObj=util.errorObj;var async=Promise._async;Promise.prototype["break"]=Promise.prototype.cancel=function(){if(!debug.cancellation())return this._warn("cancellation is disabled");var promise=this;var child=promise;while(promise._isCancellable()){if(!promise._cancelBy(child)){if(child._isFollowing()){child._followee().cancel();}else{child._cancelBranched();}
break;}
var parent=promise._cancellationParent;if(parent==null||!parent._isCancellable()){if(promise._isFollowing()){promise._followee().cancel();}else{promise._cancelBranched();}
break;}else{if(promise._isFollowing())promise._followee().cancel();promise._setWillBeCancelled();child=promise;promise=parent;}}};Promise.prototype._branchHasCancelled=function(){this._branchesRemainingToCancel--;};Promise.prototype._enoughBranchesHaveCancelled=function(){return this._branchesRemainingToCancel===undefined||this._branchesRemainingToCancel<=0;};Promise.prototype._cancelBy=function(canceller){if(canceller===this){this._branchesRemainingToCancel=0;this._invokeOnCancel();return true;}else{this._branchHasCancelled();if(this._enoughBranchesHaveCancelled()){this._invokeOnCancel();return true;}}
return false;};Promise.prototype._cancelBranched=function(){if(this._enoughBranchesHaveCancelled()){this._cancel();}};Promise.prototype._cancel=function(){if(!this._isCancellable())return;this._setCancelled();async.invoke(this._cancelPromises,this,undefined);};Promise.prototype._cancelPromises=function(){if(this._length()>0)this._settlePromises();};Promise.prototype._unsetOnCancel=function(){this._onCancelField=undefined;};Promise.prototype._isCancellable=function(){return this.isPending()&&!this._isCancelled();};Promise.prototype.isCancellable=function(){return this.isPending()&&!this.isCancelled();};Promise.prototype._doInvokeOnCancel=function(onCancelCallback,internalOnly){if(util.isArray(onCancelCallback)){for(var i=0;i<onCancelCallback.length;++i){this._doInvokeOnCancel(onCancelCallback[i],internalOnly);}}else if(onCancelCallback!==undefined){if(typeof onCancelCallback==="function"){if(!internalOnly){var e=tryCatch(onCancelCallback).call(this._boundValue());if(e===errorObj){this._attachExtraTrace(e.e);async.throwLater(e.e);}}}else{onCancelCallback._resultCancelled(this);}}};Promise.prototype._invokeOnCancel=function(){var onCancelCallback=this._onCancel();this._unsetOnCancel();async.invoke(this._doInvokeOnCancel,this,onCancelCallback);};Promise.prototype._invokeInternalOnCancel=function(){if(this._isCancellable()){this._doInvokeOnCancel(this._onCancel(),true);this._unsetOnCancel();}};Promise.prototype._resultCancelled=function(){this.cancel();};};},{"./util":74}],45:[function(require,module,exports){"use strict";module.exports=function(NEXT_FILTER){var util=require("./util");var getKeys=require("./es5").keys;var tryCatch=util.tryCatch;var errorObj=util.errorObj;function catchFilter(instances,cb,promise){return function(e){var boundTo=promise._boundValue();predicateLoop:for(var i=0;i<instances.length;++i){var item=instances[i];if(item===Error||(item!=null&&item.prototype instanceof Error)){if(e instanceof item){return tryCatch(cb).call(boundTo,e);}}else if(typeof item==="function"){var matchesPredicate=tryCatch(item).call(boundTo,e);if(matchesPredicate===errorObj){return matchesPredicate;}else if(matchesPredicate){return tryCatch(cb).call(boundTo,e);}}else if(util.isObject(e)){var keys=getKeys(item);for(var j=0;j<keys.length;++j){var key=keys[j];if(item[key]!=e[key]){continue predicateLoop;}}
return tryCatch(cb).call(boundTo,e);}}
return NEXT_FILTER;};}
return catchFilter;};},{"./es5":51,"./util":74}],46:[function(require,module,exports){"use strict";module.exports=function(Promise){var longStackTraces=false;var contextStack=[];Promise.prototype._promiseCreated=function(){};Promise.prototype._pushContext=function(){};Promise.prototype._popContext=function(){return null;};Promise._peekContext=Promise.prototype._peekContext=function(){};function Context(){this._trace=new Context.CapturedTrace(peekContext());}
Context.prototype._pushContext=function(){if(this._trace!==undefined){this._trace._promiseCreated=null;contextStack.push(this._trace);}};Context.prototype._popContext=function(){if(this._trace!==undefined){var trace=contextStack.pop();var ret=trace._promiseCreated;trace._promiseCreated=null;return ret;}
return null;};function createContext(){if(longStackTraces)return new Context();}
function peekContext(){var lastIndex=contextStack.length-1;if(lastIndex>=0){return contextStack[lastIndex];}
return undefined;}
Context.CapturedTrace=null;Context.create=createContext;Context.deactivateLongStackTraces=function(){};Context.activateLongStackTraces=function(){var Promise_pushContext=Promise.prototype._pushContext;var Promise_popContext=Promise.prototype._popContext;var Promise_PeekContext=Promise._peekContext;var Promise_peekContext=Promise.prototype._peekContext;var Promise_promiseCreated=Promise.prototype._promiseCreated;Context.deactivateLongStackTraces=function(){Promise.prototype._pushContext=Promise_pushContext;Promise.prototype._popContext=Promise_popContext;Promise._peekContext=Promise_PeekContext;Promise.prototype._peekContext=Promise_peekContext;Promise.prototype._promiseCreated=Promise_promiseCreated;longStackTraces=false;};longStackTraces=true;Promise.prototype._pushContext=Context.prototype._pushContext;Promise.prototype._popContext=Context.prototype._popContext;Promise._peekContext=Promise.prototype._peekContext=peekContext;Promise.prototype._promiseCreated=function(){var ctx=this._peekContext();if(ctx&&ctx._promiseCreated==null)ctx._promiseCreated=this;};};return Context;};},{}],47:[function(require,module,exports){(function(process){"use strict";module.exports=function(Promise,Context){var getDomain=Promise._getDomain;var async=Promise._async;var Warning=require("./errors").Warning;var util=require("./util");var canAttachTrace=util.canAttachTrace;var unhandledRejectionHandled;var possiblyUnhandledRejection;var bluebirdFramePattern=/[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;var nodeFramePattern=/\((?:timers\.js):\d+:\d+\)/;var parseLinePattern=/[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;var stackFramePattern=null;var formatStack=null;var indentStackFrames=false;var printWarning;var debugging=!!(util.env("BLUEBIRD_DEBUG")!=0&&(false||util.env("BLUEBIRD_DEBUG")||util.env("NODE_ENV")==="development"));var warnings=!!(util.env("BLUEBIRD_WARNINGS")!=0&&(debugging||util.env("BLUEBIRD_WARNINGS")));var longStackTraces=!!(util.env("BLUEBIRD_LONG_STACK_TRACES")!=0&&(debugging||util.env("BLUEBIRD_LONG_STACK_TRACES")));var wForgottenReturn=util.env("BLUEBIRD_W_FORGOTTEN_RETURN")!=0&&(warnings||!!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));Promise.prototype.suppressUnhandledRejections=function(){var target=this._target();target._bitField=((target._bitField&(~1048576))|524288);};Promise.prototype._ensurePossibleRejectionHandled=function(){if((this._bitField&524288)!==0)return;this._setRejectionIsUnhandled();async.invokeLater(this._notifyUnhandledRejection,this,undefined);};Promise.prototype._notifyUnhandledRejectionIsHandled=function(){fireRejectionEvent("rejectionHandled",unhandledRejectionHandled,undefined,this);};Promise.prototype._setReturnedNonUndefined=function(){this._bitField=this._bitField|268435456;};Promise.prototype._returnedNonUndefined=function(){return(this._bitField&268435456)!==0;};Promise.prototype._notifyUnhandledRejection=function(){if(this._isRejectionUnhandled()){var reason=this._settledValue();this._setUnhandledRejectionIsNotified();fireRejectionEvent("unhandledRejection",possiblyUnhandledRejection,reason,this);}};Promise.prototype._setUnhandledRejectionIsNotified=function(){this._bitField=this._bitField|262144;};Promise.prototype._unsetUnhandledRejectionIsNotified=function(){this._bitField=this._bitField&(~262144);};Promise.prototype._isUnhandledRejectionNotified=function(){return(this._bitField&262144)>0;};Promise.prototype._setRejectionIsUnhandled=function(){this._bitField=this._bitField|1048576;};Promise.prototype._unsetRejectionIsUnhandled=function(){this._bitField=this._bitField&(~1048576);if(this._isUnhandledRejectionNotified()){this._unsetUnhandledRejectionIsNotified();this._notifyUnhandledRejectionIsHandled();}};Promise.prototype._isRejectionUnhandled=function(){return(this._bitField&1048576)>0;};Promise.prototype._warn=function(message,shouldUseOwnTrace,promise){return warn(message,shouldUseOwnTrace,promise||this);};Promise.onPossiblyUnhandledRejection=function(fn){var domain=getDomain();possiblyUnhandledRejection=typeof fn==="function"?(domain===null?fn:util.domainBind(domain,fn)):undefined;};Promise.onUnhandledRejectionHandled=function(fn){var domain=getDomain();unhandledRejectionHandled=typeof fn==="function"?(domain===null?fn:util.domainBind(domain,fn)):undefined;};var disableLongStackTraces=function(){};Promise.longStackTraces=function(){if(async.haveItemsQueued()&&!config.longStackTraces){throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
if(!config.longStackTraces&&longStackTracesIsSupported()){var Promise_captureStackTrace=Promise.prototype._captureStackTrace;var Promise_attachExtraTrace=Promise.prototype._attachExtraTrace;config.longStackTraces=true;disableLongStackTraces=function(){if(async.haveItemsQueued()&&!config.longStackTraces){throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
Promise.prototype._captureStackTrace=Promise_captureStackTrace;Promise.prototype._attachExtraTrace=Promise_attachExtraTrace;Context.deactivateLongStackTraces();async.enableTrampoline();config.longStackTraces=false;};Promise.prototype._captureStackTrace=longStackTracesCaptureStackTrace;Promise.prototype._attachExtraTrace=longStackTracesAttachExtraTrace;Context.activateLongStackTraces();async.disableTrampolineIfNecessary();}};Promise.hasLongStackTraces=function(){return config.longStackTraces&&longStackTracesIsSupported();};var fireDomEvent=(function(){try{if(typeof CustomEvent==="function"){var event=new CustomEvent("CustomEvent");util.global.dispatchEvent(event);return function(name,event){var domEvent=new CustomEvent(name.toLowerCase(),{detail:event,cancelable:true});return!util.global.dispatchEvent(domEvent);};}else if(typeof Event==="function"){var event=new Event("CustomEvent");util.global.dispatchEvent(event);return function(name,event){var domEvent=new Event(name.toLowerCase(),{cancelable:true});domEvent.detail=event;return!util.global.dispatchEvent(domEvent);};}else{var event=document.createEvent("CustomEvent");event.initCustomEvent("testingtheevent",false,true,{});util.global.dispatchEvent(event);return function(name,event){var domEvent=document.createEvent("CustomEvent");domEvent.initCustomEvent(name.toLowerCase(),false,true,event);return!util.global.dispatchEvent(domEvent);};}}catch(e){}
return function(){return false;};})();var fireGlobalEvent=(function(){if(util.isNode){return function(){return process.emit.apply(process,arguments);};}else{if(!util.global){return function(){return false;};}
return function(name){var methodName="on"+name.toLowerCase();var method=util.global[methodName];if(!method)return false;method.apply(util.global,[].slice.call(arguments,1));return true;};}})();function generatePromiseLifecycleEventObject(name,promise){return{promise:promise};}
var eventToObjectGenerator={promiseCreated:generatePromiseLifecycleEventObject,promiseFulfilled:generatePromiseLifecycleEventObject,promiseRejected:generatePromiseLifecycleEventObject,promiseResolved:generatePromiseLifecycleEventObject,promiseCancelled:generatePromiseLifecycleEventObject,promiseChained:function(name,promise,child){return{promise:promise,child:child};},warning:function(name,warning){return{warning:warning};},unhandledRejection:function(name,reason,promise){return{reason:reason,promise:promise};},rejectionHandled:generatePromiseLifecycleEventObject};var activeFireEvent=function(name){var globalEventFired=false;try{globalEventFired=fireGlobalEvent.apply(null,arguments);}catch(e){async.throwLater(e);globalEventFired=true;}
var domEventFired=false;try{domEventFired=fireDomEvent(name,eventToObjectGenerator[name].apply(null,arguments));}catch(e){async.throwLater(e);domEventFired=true;}
return domEventFired||globalEventFired;};Promise.config=function(opts){opts=Object(opts);if("longStackTraces"in opts){if(opts.longStackTraces){Promise.longStackTraces();}else if(!opts.longStackTraces&&Promise.hasLongStackTraces()){disableLongStackTraces();}}
if("warnings"in opts){var warningsOption=opts.warnings;config.warnings=!!warningsOption;wForgottenReturn=config.warnings;if(util.isObject(warningsOption)){if("wForgottenReturn"in warningsOption){wForgottenReturn=!!warningsOption.wForgottenReturn;}}}
if("cancellation"in opts&&opts.cancellation&&!config.cancellation){if(async.haveItemsQueued()){throw new Error("cannot enable cancellation after promises are in use");}
Promise.prototype._clearCancellationData=cancellationClearCancellationData;Promise.prototype._propagateFrom=cancellationPropagateFrom;Promise.prototype._onCancel=cancellationOnCancel;Promise.prototype._setOnCancel=cancellationSetOnCancel;Promise.prototype._attachCancellationCallback=cancellationAttachCancellationCallback;Promise.prototype._execute=cancellationExecute;propagateFromFunction=cancellationPropagateFrom;config.cancellation=true;}
if("monitoring"in opts){if(opts.monitoring&&!config.monitoring){config.monitoring=true;Promise.prototype._fireEvent=activeFireEvent;}else if(!opts.monitoring&&config.monitoring){config.monitoring=false;Promise.prototype._fireEvent=defaultFireEvent;}}
return Promise;};function defaultFireEvent(){return false;}
Promise.prototype._fireEvent=defaultFireEvent;Promise.prototype._execute=function(executor,resolve,reject){try{executor(resolve,reject);}catch(e){return e;}};Promise.prototype._onCancel=function(){};Promise.prototype._setOnCancel=function(handler){;};Promise.prototype._attachCancellationCallback=function(onCancel){;};Promise.prototype._captureStackTrace=function(){};Promise.prototype._attachExtraTrace=function(){};Promise.prototype._clearCancellationData=function(){};Promise.prototype._propagateFrom=function(parent,flags){;;};function cancellationExecute(executor,resolve,reject){var promise=this;try{executor(resolve,reject,function(onCancel){if(typeof onCancel!=="function"){throw new TypeError("onCancel must be a function, got: "+
util.toString(onCancel));}
promise._attachCancellationCallback(onCancel);});}catch(e){return e;}}
function cancellationAttachCancellationCallback(onCancel){if(!this._isCancellable())return this;var previousOnCancel=this._onCancel();if(previousOnCancel!==undefined){if(util.isArray(previousOnCancel)){previousOnCancel.push(onCancel);}else{this._setOnCancel([previousOnCancel,onCancel]);}}else{this._setOnCancel(onCancel);}}
function cancellationOnCancel(){return this._onCancelField;}
function cancellationSetOnCancel(onCancel){this._onCancelField=onCancel;}
function cancellationClearCancellationData(){this._cancellationParent=undefined;this._onCancelField=undefined;}
function cancellationPropagateFrom(parent,flags){if((flags&1)!==0){this._cancellationParent=parent;var branchesRemainingToCancel=parent._branchesRemainingToCancel;if(branchesRemainingToCancel===undefined){branchesRemainingToCancel=0;}
parent._branchesRemainingToCancel=branchesRemainingToCancel+1;}
if((flags&2)!==0&&parent._isBound()){this._setBoundTo(parent._boundTo);}}
function bindingPropagateFrom(parent,flags){if((flags&2)!==0&&parent._isBound()){this._setBoundTo(parent._boundTo);}}
var propagateFromFunction=bindingPropagateFrom;function boundValueFunction(){var ret=this._boundTo;if(ret!==undefined){if(ret instanceof Promise){if(ret.isFulfilled()){return ret.value();}else{return undefined;}}}
return ret;}
function longStackTracesCaptureStackTrace(){this._trace=new CapturedTrace(this._peekContext());}
function longStackTracesAttachExtraTrace(error,ignoreSelf){if(canAttachTrace(error)){var trace=this._trace;if(trace!==undefined){if(ignoreSelf)trace=trace._parent;}
if(trace!==undefined){trace.attachExtraTrace(error);}else if(!error.__stackCleaned__){var parsed=parseStackAndMessage(error);util.notEnumerableProp(error,"stack",parsed.message+"\n"+parsed.stack.join("\n"));util.notEnumerableProp(error,"__stackCleaned__",true);}}}
function checkForgottenReturns(returnValue,promiseCreated,name,promise,parent){if(returnValue===undefined&&promiseCreated!==null&&wForgottenReturn){if(parent!==undefined&&parent._returnedNonUndefined())return;if((promise._bitField&65535)===0)return;if(name)name=name+" ";var handlerLine="";var creatorLine="";if(promiseCreated._trace){var traceLines=promiseCreated._trace.stack.split("\n");var stack=cleanStack(traceLines);for(var i=stack.length-1;i>=0;--i){var line=stack[i];if(!nodeFramePattern.test(line)){var lineMatches=line.match(parseLinePattern);if(lineMatches){handlerLine="at "+lineMatches[1]+
":"+lineMatches[2]+":"+lineMatches[3]+" ";}
break;}}
if(stack.length>0){var firstUserLine=stack[0];for(var i=0;i<traceLines.length;++i){if(traceLines[i]===firstUserLine){if(i>0){creatorLine="\n"+traceLines[i-1];}
break;}}}}
var msg="a promise was created in a "+name+
"handler "+handlerLine+"but was not returned from it, "+
"see http://goo.gl/rRqMUw"+
creatorLine;promise._warn(msg,true,promiseCreated);}}
function deprecated(name,replacement){var message=name+
" is deprecated and will be removed in a future version.";if(replacement)message+=" Use "+replacement+" instead.";return warn(message);}
function warn(message,shouldUseOwnTrace,promise){if(!config.warnings)return;var warning=new Warning(message);var ctx;if(shouldUseOwnTrace){promise._attachExtraTrace(warning);}else if(config.longStackTraces&&(ctx=Promise._peekContext())){ctx.attachExtraTrace(warning);}else{var parsed=parseStackAndMessage(warning);warning.stack=parsed.message+"\n"+parsed.stack.join("\n");}
if(!activeFireEvent("warning",warning)){formatAndLogError(warning,"",true);}}
function reconstructStack(message,stacks){for(var i=0;i<stacks.length-1;++i){stacks[i].push("From previous event:");stacks[i]=stacks[i].join("\n");}
if(i<stacks.length){stacks[i]=stacks[i].join("\n");}
return message+"\n"+stacks.join("\n");}
function removeDuplicateOrEmptyJumps(stacks){for(var i=0;i<stacks.length;++i){if(stacks[i].length===0||((i+1<stacks.length)&&stacks[i][0]===stacks[i+1][0])){stacks.splice(i,1);i--;}}}
function removeCommonRoots(stacks){var current=stacks[0];for(var i=1;i<stacks.length;++i){var prev=stacks[i];var currentLastIndex=current.length-1;var currentLastLine=current[currentLastIndex];var commonRootMeetPoint=-1;for(var j=prev.length-1;j>=0;--j){if(prev[j]===currentLastLine){commonRootMeetPoint=j;break;}}
for(var j=commonRootMeetPoint;j>=0;--j){var line=prev[j];if(current[currentLastIndex]===line){current.pop();currentLastIndex--;}else{break;}}
current=prev;}}
function cleanStack(stack){var ret=[];for(var i=0;i<stack.length;++i){var line=stack[i];var isTraceLine="    (No stack trace)"===line||stackFramePattern.test(line);var isInternalFrame=isTraceLine&&shouldIgnore(line);if(isTraceLine&&!isInternalFrame){if(indentStackFrames&&line.charAt(0)!==" "){line="    "+line;}
ret.push(line);}}
return ret;}
function stackFramesAsArray(error){var stack=error.stack.replace(/\s+$/g,"").split("\n");for(var i=0;i<stack.length;++i){var line=stack[i];if("    (No stack trace)"===line||stackFramePattern.test(line)){break;}}
if(i>0&&error.name!="SyntaxError"){stack=stack.slice(i);}
return stack;}
function parseStackAndMessage(error){var stack=error.stack;var message=error.toString();stack=typeof stack==="string"&&stack.length>0?stackFramesAsArray(error):["    (No stack trace)"];return{message:message,stack:error.name=="SyntaxError"?stack:cleanStack(stack)};}
function formatAndLogError(error,title,isSoft){if(typeof console!=="undefined"){var message;if(util.isObject(error)){var stack=error.stack;message=title+formatStack(stack,error);}else{message=title+String(error);}
if(typeof printWarning==="function"){printWarning(message,isSoft);}else if(typeof console.log==="function"||typeof console.log==="object"){console.log(message);}}}
function fireRejectionEvent(name,localHandler,reason,promise){var localEventFired=false;try{if(typeof localHandler==="function"){localEventFired=true;if(name==="rejectionHandled"){localHandler(promise);}else{localHandler(reason,promise);}}}catch(e){async.throwLater(e);}
if(name==="unhandledRejection"){if(!activeFireEvent(name,reason,promise)&&!localEventFired){formatAndLogError(reason,"Unhandled rejection ");}}else{activeFireEvent(name,promise);}}
function formatNonError(obj){var str;if(typeof obj==="function"){str="[function "+
(obj.name||"anonymous")+
"]";}else{str=obj&&typeof obj.toString==="function"?obj.toString():util.toString(obj);var ruselessToString=/\[object [a-zA-Z0-9$_]+\]/;if(ruselessToString.test(str)){try{var newStr=JSON.stringify(obj);str=newStr;}
catch(e){}}
if(str.length===0){str="(empty array)";}}
return("(<"+snip(str)+">, no stack trace)");}
function snip(str){var maxChars=41;if(str.length<maxChars){return str;}
return str.substr(0,maxChars-3)+"...";}
function longStackTracesIsSupported(){return typeof captureStackTrace==="function";}
var shouldIgnore=function(){return false;};var parseLineInfoRegex=/[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;function parseLineInfo(line){var matches=line.match(parseLineInfoRegex);if(matches){return{fileName:matches[1],line:parseInt(matches[2],10)};}}
function setBounds(firstLineError,lastLineError){if(!longStackTracesIsSupported())return;var firstStackLines=firstLineError.stack.split("\n");var lastStackLines=lastLineError.stack.split("\n");var firstIndex=-1;var lastIndex=-1;var firstFileName;var lastFileName;for(var i=0;i<firstStackLines.length;++i){var result=parseLineInfo(firstStackLines[i]);if(result){firstFileName=result.fileName;firstIndex=result.line;break;}}
for(var i=0;i<lastStackLines.length;++i){var result=parseLineInfo(lastStackLines[i]);if(result){lastFileName=result.fileName;lastIndex=result.line;break;}}
if(firstIndex<0||lastIndex<0||!firstFileName||!lastFileName||firstFileName!==lastFileName||firstIndex>=lastIndex){return;}
shouldIgnore=function(line){if(bluebirdFramePattern.test(line))return true;var info=parseLineInfo(line);if(info){if(info.fileName===firstFileName&&(firstIndex<=info.line&&info.line<=lastIndex)){return true;}}
return false;};}
function CapturedTrace(parent){this._parent=parent;this._promisesCreated=0;var length=this._length=1+(parent===undefined?0:parent._length);captureStackTrace(this,CapturedTrace);if(length>32)this.uncycle();}
util.inherits(CapturedTrace,Error);Context.CapturedTrace=CapturedTrace;CapturedTrace.prototype.uncycle=function(){var length=this._length;if(length<2)return;var nodes=[];var stackToIndex={};for(var i=0,node=this;node!==undefined;++i){nodes.push(node);node=node._parent;}
length=this._length=i;for(var i=length-1;i>=0;--i){var stack=nodes[i].stack;if(stackToIndex[stack]===undefined){stackToIndex[stack]=i;}}
for(var i=0;i<length;++i){var currentStack=nodes[i].stack;var index=stackToIndex[currentStack];if(index!==undefined&&index!==i){if(index>0){nodes[index-1]._parent=undefined;nodes[index-1]._length=1;}
nodes[i]._parent=undefined;nodes[i]._length=1;var cycleEdgeNode=i>0?nodes[i-1]:this;if(index<length-1){cycleEdgeNode._parent=nodes[index+1];cycleEdgeNode._parent.uncycle();cycleEdgeNode._length=cycleEdgeNode._parent._length+1;}else{cycleEdgeNode._parent=undefined;cycleEdgeNode._length=1;}
var currentChildLength=cycleEdgeNode._length+1;for(var j=i-2;j>=0;--j){nodes[j]._length=currentChildLength;currentChildLength++;}
return;}}};CapturedTrace.prototype.attachExtraTrace=function(error){if(error.__stackCleaned__)return;this.uncycle();var parsed=parseStackAndMessage(error);var message=parsed.message;var stacks=[parsed.stack];var trace=this;while(trace!==undefined){stacks.push(cleanStack(trace.stack.split("\n")));trace=trace._parent;}
removeCommonRoots(stacks);removeDuplicateOrEmptyJumps(stacks);util.notEnumerableProp(error,"stack",reconstructStack(message,stacks));util.notEnumerableProp(error,"__stackCleaned__",true);};var captureStackTrace=(function stackDetection(){var v8stackFramePattern=/^\s*at\s*/;var v8stackFormatter=function(stack,error){if(typeof stack==="string")return stack;if(error.name!==undefined&&error.message!==undefined){return error.toString();}
return formatNonError(error);};if(typeof Error.stackTraceLimit==="number"&&typeof Error.captureStackTrace==="function"){Error.stackTraceLimit+=6;stackFramePattern=v8stackFramePattern;formatStack=v8stackFormatter;var captureStackTrace=Error.captureStackTrace;shouldIgnore=function(line){return bluebirdFramePattern.test(line);};return function(receiver,ignoreUntil){Error.stackTraceLimit+=6;captureStackTrace(receiver,ignoreUntil);Error.stackTraceLimit-=6;};}
var err=new Error();if(typeof err.stack==="string"&&err.stack.split("\n")[0].indexOf("stackDetection@")>=0){stackFramePattern=/@/;formatStack=v8stackFormatter;indentStackFrames=true;return function captureStackTrace(o){o.stack=new Error().stack;};}
var hasStackAfterThrow;try{throw new Error();}
catch(e){hasStackAfterThrow=("stack"in e);}
if(!("stack"in err)&&hasStackAfterThrow&&typeof Error.stackTraceLimit==="number"){stackFramePattern=v8stackFramePattern;formatStack=v8stackFormatter;return function captureStackTrace(o){Error.stackTraceLimit+=6;try{throw new Error();}
catch(e){o.stack=e.stack;}
Error.stackTraceLimit-=6;};}
formatStack=function(stack,error){if(typeof stack==="string")return stack;if((typeof error==="object"||typeof error==="function")&&error.name!==undefined&&error.message!==undefined){return error.toString();}
return formatNonError(error);};return null;})([]);if(typeof console!=="undefined"&&typeof console.warn!=="undefined"){printWarning=function(message){console.warn(message);};if(util.isNode&&process.stderr.isTTY){printWarning=function(message,isSoft){var color=isSoft?"\u001b[33m":"\u001b[31m";console.warn(color+message+"\u001b[0m\n");};}else if(!util.isNode&&typeof(new Error().stack)==="string"){printWarning=function(message,isSoft){console.warn("%c"+message,isSoft?"color: darkorange":"color: red");};}}
var config={warnings:warnings,longStackTraces:false,cancellation:false,monitoring:false};if(longStackTraces)Promise.longStackTraces();return{longStackTraces:function(){return config.longStackTraces;},warnings:function(){return config.warnings;},cancellation:function(){return config.cancellation;},monitoring:function(){return config.monitoring;},propagateFromFunction:function(){return propagateFromFunction;},boundValueFunction:function(){return boundValueFunction;},checkForgottenReturns:checkForgottenReturns,setBounds:setBounds,warn:warn,deprecated:deprecated,CapturedTrace:CapturedTrace,fireDomEvent:fireDomEvent,fireGlobalEvent:fireGlobalEvent};};}).call(this,require('_process'))},{"./errors":50,"./util":74,"_process":138}],48:[function(require,module,exports){"use strict";module.exports=function(Promise){function returner(){return this.value;}
function thrower(){throw this.reason;}
Promise.prototype["return"]=Promise.prototype.thenReturn=function(value){if(value instanceof Promise)value.suppressUnhandledRejections();return this._then(returner,undefined,undefined,{value:value},undefined);};Promise.prototype["throw"]=Promise.prototype.thenThrow=function(reason){return this._then(thrower,undefined,undefined,{reason:reason},undefined);};Promise.prototype.catchThrow=function(reason){if(arguments.length<=1){return this._then(undefined,thrower,undefined,{reason:reason},undefined);}else{var _reason=arguments[1];var handler=function(){throw _reason;};return this.caught(reason,handler);}};Promise.prototype.catchReturn=function(value){if(arguments.length<=1){if(value instanceof Promise)value.suppressUnhandledRejections();return this._then(undefined,returner,undefined,{value:value},undefined);}else{var _value=arguments[1];if(_value instanceof Promise)_value.suppressUnhandledRejections();var handler=function(){return _value;};return this.caught(value,handler);}};};},{}],49:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL){var PromiseReduce=Promise.reduce;var PromiseAll=Promise.all;function promiseAllThis(){return PromiseAll(this);}
function PromiseMapSeries(promises,fn){return PromiseReduce(promises,fn,INTERNAL,INTERNAL);}
Promise.prototype.each=function(fn){return PromiseReduce(this,fn,INTERNAL,0)._then(promiseAllThis,undefined,undefined,this,undefined);};Promise.prototype.mapSeries=function(fn){return PromiseReduce(this,fn,INTERNAL,INTERNAL);};Promise.each=function(promises,fn){return PromiseReduce(promises,fn,INTERNAL,0)._then(promiseAllThis,undefined,undefined,promises,undefined);};Promise.mapSeries=PromiseMapSeries;};},{}],50:[function(require,module,exports){"use strict";var es5=require("./es5");var Objectfreeze=es5.freeze;var util=require("./util");var inherits=util.inherits;var notEnumerableProp=util.notEnumerableProp;function subError(nameProperty,defaultMessage){function SubError(message){if(!(this instanceof SubError))return new SubError(message);notEnumerableProp(this,"message",typeof message==="string"?message:defaultMessage);notEnumerableProp(this,"name",nameProperty);if(Error.captureStackTrace){Error.captureStackTrace(this,this.constructor);}else{Error.call(this);}}
inherits(SubError,Error);return SubError;}
var _TypeError,_RangeError;var Warning=subError("Warning","warning");var CancellationError=subError("CancellationError","cancellation error");var TimeoutError=subError("TimeoutError","timeout error");var AggregateError=subError("AggregateError","aggregate error");try{_TypeError=TypeError;_RangeError=RangeError;}catch(e){_TypeError=subError("TypeError","type error");_RangeError=subError("RangeError","range error");}
var methods=("join pop push shift unshift slice filter forEach some "+
"every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");for(var i=0;i<methods.length;++i){if(typeof Array.prototype[methods[i]]==="function"){AggregateError.prototype[methods[i]]=Array.prototype[methods[i]];}}
es5.defineProperty(AggregateError.prototype,"length",{value:0,configurable:false,writable:true,enumerable:true});AggregateError.prototype["isOperational"]=true;var level=0;AggregateError.prototype.toString=function(){var indent=Array(level*4+1).join(" ");var ret="\n"+indent+"AggregateError of:"+"\n";level++;indent=Array(level*4+1).join(" ");for(var i=0;i<this.length;++i){var str=this[i]===this?"[Circular AggregateError]":this[i]+"";var lines=str.split("\n");for(var j=0;j<lines.length;++j){lines[j]=indent+lines[j];}
str=lines.join("\n");ret+=str+"\n";}
level--;return ret;};function OperationalError(message){if(!(this instanceof OperationalError))
return new OperationalError(message);notEnumerableProp(this,"name","OperationalError");notEnumerableProp(this,"message",message);this.cause=message;this["isOperational"]=true;if(message instanceof Error){notEnumerableProp(this,"message",message.message);notEnumerableProp(this,"stack",message.stack);}else if(Error.captureStackTrace){Error.captureStackTrace(this,this.constructor);}}
inherits(OperationalError,Error);var errorTypes=Error["__BluebirdErrorTypes__"];if(!errorTypes){errorTypes=Objectfreeze({CancellationError:CancellationError,TimeoutError:TimeoutError,OperationalError:OperationalError,RejectionError:OperationalError,AggregateError:AggregateError});es5.defineProperty(Error,"__BluebirdErrorTypes__",{value:errorTypes,writable:false,enumerable:false,configurable:false});}
module.exports={Error:Error,TypeError:_TypeError,RangeError:_RangeError,CancellationError:errorTypes.CancellationError,OperationalError:errorTypes.OperationalError,TimeoutError:errorTypes.TimeoutError,AggregateError:errorTypes.AggregateError,Warning:Warning};},{"./es5":51,"./util":74}],51:[function(require,module,exports){var isES5=(function(){"use strict";return this===undefined;})();if(isES5){module.exports={freeze:Object.freeze,defineProperty:Object.defineProperty,getDescriptor:Object.getOwnPropertyDescriptor,keys:Object.keys,names:Object.getOwnPropertyNames,getPrototypeOf:Object.getPrototypeOf,isArray:Array.isArray,isES5:isES5,propertyIsWritable:function(obj,prop){var descriptor=Object.getOwnPropertyDescriptor(obj,prop);return!!(!descriptor||descriptor.writable||descriptor.set);}};}else{var has={}.hasOwnProperty;var str={}.toString;var proto={}.constructor.prototype;var ObjectKeys=function(o){var ret=[];for(var key in o){if(has.call(o,key)){ret.push(key);}}
return ret;};var ObjectGetDescriptor=function(o,key){return{value:o[key]};};var ObjectDefineProperty=function(o,key,desc){o[key]=desc.value;return o;};var ObjectFreeze=function(obj){return obj;};var ObjectGetPrototypeOf=function(obj){try{return Object(obj).constructor.prototype;}
catch(e){return proto;}};var ArrayIsArray=function(obj){try{return str.call(obj)==="[object Array]";}
catch(e){return false;}};module.exports={isArray:ArrayIsArray,keys:ObjectKeys,names:ObjectKeys,defineProperty:ObjectDefineProperty,getDescriptor:ObjectGetDescriptor,freeze:ObjectFreeze,getPrototypeOf:ObjectGetPrototypeOf,isES5:isES5,propertyIsWritable:function(){return true;}};}},{}],52:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL){var PromiseMap=Promise.map;Promise.prototype.filter=function(fn,options){return PromiseMap(this,fn,options,INTERNAL);};Promise.filter=function(promises,fn,options){return PromiseMap(promises,fn,options,INTERNAL);};};},{}],53:[function(require,module,exports){"use strict";module.exports=function(Promise,tryConvertToPromise){var util=require("./util");var CancellationError=Promise.CancellationError;var errorObj=util.errorObj;function PassThroughHandlerContext(promise,type,handler){this.promise=promise;this.type=type;this.handler=handler;this.called=false;this.cancelPromise=null;}
PassThroughHandlerContext.prototype.isFinallyHandler=function(){return this.type===0;};function FinallyHandlerCancelReaction(finallyHandler){this.finallyHandler=finallyHandler;}
FinallyHandlerCancelReaction.prototype._resultCancelled=function(){checkCancel(this.finallyHandler);};function checkCancel(ctx,reason){if(ctx.cancelPromise!=null){if(arguments.length>1){ctx.cancelPromise._reject(reason);}else{ctx.cancelPromise._cancel();}
ctx.cancelPromise=null;return true;}
return false;}
function succeed(){return finallyHandler.call(this,this.promise._target()._settledValue());}
function fail(reason){if(checkCancel(this,reason))return;errorObj.e=reason;return errorObj;}
function finallyHandler(reasonOrValue){var promise=this.promise;var handler=this.handler;if(!this.called){this.called=true;var ret=this.isFinallyHandler()?handler.call(promise._boundValue()):handler.call(promise._boundValue(),reasonOrValue);if(ret!==undefined){promise._setReturnedNonUndefined();var maybePromise=tryConvertToPromise(ret,promise);if(maybePromise instanceof Promise){if(this.cancelPromise!=null){if(maybePromise._isCancelled()){var reason=new CancellationError("late cancellation observer");promise._attachExtraTrace(reason);errorObj.e=reason;return errorObj;}else if(maybePromise.isPending()){maybePromise._attachCancellationCallback(new FinallyHandlerCancelReaction(this));}}
return maybePromise._then(succeed,fail,undefined,this,undefined);}}}
if(promise.isRejected()){checkCancel(this);errorObj.e=reasonOrValue;return errorObj;}else{checkCancel(this);return reasonOrValue;}}
Promise.prototype._passThrough=function(handler,type,success,fail){if(typeof handler!=="function")return this.then();return this._then(success,fail,undefined,new PassThroughHandlerContext(this,type,handler),undefined);};Promise.prototype.lastly=Promise.prototype["finally"]=function(handler){return this._passThrough(handler,0,finallyHandler,finallyHandler);};Promise.prototype.tap=function(handler){return this._passThrough(handler,1,finallyHandler);};return PassThroughHandlerContext;};},{"./util":74}],54:[function(require,module,exports){"use strict";module.exports=function(Promise,apiRejection,INTERNAL,tryConvertToPromise,Proxyable,debug){var errors=require("./errors");var TypeError=errors.TypeError;var util=require("./util");var errorObj=util.errorObj;var tryCatch=util.tryCatch;var yieldHandlers=[];function promiseFromYieldHandler(value,yieldHandlers,traceParent){for(var i=0;i<yieldHandlers.length;++i){traceParent._pushContext();var result=tryCatch(yieldHandlers[i])(value);traceParent._popContext();if(result===errorObj){traceParent._pushContext();var ret=Promise.reject(errorObj.e);traceParent._popContext();return ret;}
var maybePromise=tryConvertToPromise(result,traceParent);if(maybePromise instanceof Promise)return maybePromise;}
return null;}
function PromiseSpawn(generatorFunction,receiver,yieldHandler,stack){if(debug.cancellation()){var internal=new Promise(INTERNAL);var _finallyPromise=this._finallyPromise=new Promise(INTERNAL);this._promise=internal.lastly(function(){return _finallyPromise;});internal._captureStackTrace();internal._setOnCancel(this);}else{var promise=this._promise=new Promise(INTERNAL);promise._captureStackTrace();}
this._stack=stack;this._generatorFunction=generatorFunction;this._receiver=receiver;this._generator=undefined;this._yieldHandlers=typeof yieldHandler==="function"?[yieldHandler].concat(yieldHandlers):yieldHandlers;this._yieldedPromise=null;this._cancellationPhase=false;}
util.inherits(PromiseSpawn,Proxyable);PromiseSpawn.prototype._isResolved=function(){return this._promise===null;};PromiseSpawn.prototype._cleanup=function(){this._promise=this._generator=null;if(debug.cancellation()&&this._finallyPromise!==null){this._finallyPromise._fulfill();this._finallyPromise=null;}};PromiseSpawn.prototype._promiseCancelled=function(){if(this._isResolved())return;var implementsReturn=typeof this._generator["return"]!=="undefined";var result;if(!implementsReturn){var reason=new Promise.CancellationError("generator .return() sentinel");Promise.coroutine.returnSentinel=reason;this._promise._attachExtraTrace(reason);this._promise._pushContext();result=tryCatch(this._generator["throw"]).call(this._generator,reason);this._promise._popContext();}else{this._promise._pushContext();result=tryCatch(this._generator["return"]).call(this._generator,undefined);this._promise._popContext();}
this._cancellationPhase=true;this._yieldedPromise=null;this._continue(result);};PromiseSpawn.prototype._promiseFulfilled=function(value){this._yieldedPromise=null;this._promise._pushContext();var result=tryCatch(this._generator.next).call(this._generator,value);this._promise._popContext();this._continue(result);};PromiseSpawn.prototype._promiseRejected=function(reason){this._yieldedPromise=null;this._promise._attachExtraTrace(reason);this._promise._pushContext();var result=tryCatch(this._generator["throw"]).call(this._generator,reason);this._promise._popContext();this._continue(result);};PromiseSpawn.prototype._resultCancelled=function(){if(this._yieldedPromise instanceof Promise){var promise=this._yieldedPromise;this._yieldedPromise=null;promise.cancel();}};PromiseSpawn.prototype.promise=function(){return this._promise;};PromiseSpawn.prototype._run=function(){this._generator=this._generatorFunction.call(this._receiver);this._receiver=this._generatorFunction=undefined;this._promiseFulfilled(undefined);};PromiseSpawn.prototype._continue=function(result){var promise=this._promise;if(result===errorObj){this._cleanup();if(this._cancellationPhase){return promise.cancel();}else{return promise._rejectCallback(result.e,false);}}
var value=result.value;if(result.done===true){this._cleanup();if(this._cancellationPhase){return promise.cancel();}else{return promise._resolveCallback(value);}}else{var maybePromise=tryConvertToPromise(value,this._promise);if(!(maybePromise instanceof Promise)){maybePromise=promiseFromYieldHandler(maybePromise,this._yieldHandlers,this._promise);if(maybePromise===null){this._promiseRejected(new TypeError("A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s",value)+
"From coroutine:\u000a"+
this._stack.split("\n").slice(1,-7).join("\n")));return;}}
maybePromise=maybePromise._target();var bitField=maybePromise._bitField;;if(((bitField&50397184)===0)){this._yieldedPromise=maybePromise;maybePromise._proxy(this,null);}else if(((bitField&33554432)!==0)){Promise._async.invoke(this._promiseFulfilled,this,maybePromise._value());}else if(((bitField&16777216)!==0)){Promise._async.invoke(this._promiseRejected,this,maybePromise._reason());}else{this._promiseCancelled();}}};Promise.coroutine=function(generatorFunction,options){if(typeof generatorFunction!=="function"){throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
var yieldHandler=Object(options).yieldHandler;var PromiseSpawn$=PromiseSpawn;var stack=new Error().stack;return function(){var generator=generatorFunction.apply(this,arguments);var spawn=new PromiseSpawn$(undefined,undefined,yieldHandler,stack);var ret=spawn.promise();spawn._generator=generator;spawn._promiseFulfilled(undefined);return ret;};};Promise.coroutine.addYieldHandler=function(fn){if(typeof fn!=="function"){throw new TypeError("expecting a function but got "+util.classString(fn));}
yieldHandlers.push(fn);};Promise.spawn=function(generatorFunction){debug.deprecated("Promise.spawn()","Promise.coroutine()");if(typeof generatorFunction!=="function"){return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
var spawn=new PromiseSpawn(generatorFunction,this);var ret=spawn.promise();spawn._run(Promise.spawn);return ret;};};},{"./errors":50,"./util":74}],55:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,tryConvertToPromise,INTERNAL,async,getDomain){var util=require("./util");var canEvaluate=util.canEvaluate;var tryCatch=util.tryCatch;var errorObj=util.errorObj;var reject;if(!false){if(canEvaluate){var thenCallback=function(i){return new Function("value","holder","                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g,i));};var promiseSetter=function(i){return new Function("promise","holder","                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g,i));};var generateHolderClass=function(total){var props=new Array(total);for(var i=0;i<props.length;++i){props[i]="this.p"+(i+1);}
var assignment=props.join(" = ")+" = null;";var cancellationCode="var promise;\n"+props.map(function(prop){return "                                                         \n\
                promise = "+prop+";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";}).join("\n");var passedArguments=props.join(", ");var name="Holder$"+total;var code="return function(tryCatch, errorObj, Promise, async) {    \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.asyncNeeded = true;                                     \n\
                this.now = 0;                                                \n\
            }                                                                \n\
                                                                             \n\
            [TheName].prototype._callFunction = function(promise) {          \n\
                promise._pushContext();                                      \n\
                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n\
                promise._popContext();                                       \n\
                if (ret === errorObj) {                                      \n\
                    promise._rejectCallback(ret.e, false);                   \n\
                } else {                                                     \n\
                    promise._resolveCallback(ret);                           \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    if (this.asyncNeeded) {                                  \n\
                        async.invoke(this._callFunction, this, promise);     \n\
                    } else {                                                 \n\
                        this._callFunction(promise);                         \n\
                    }                                                        \n\
                                                                             \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise, async);                               \n\
        ";code=code.replace(/\[TheName\]/g,name).replace(/\[TheTotal\]/g,total).replace(/\[ThePassedArguments\]/g,passedArguments).replace(/\[TheProperties\]/g,assignment).replace(/\[CancellationCode\]/g,cancellationCode);return new Function("tryCatch","errorObj","Promise","async",code)
(tryCatch,errorObj,Promise,async);};var holderClasses=[];var thenCallbacks=[];var promiseSetters=[];for(var i=0;i<8;++i){holderClasses.push(generateHolderClass(i+1));thenCallbacks.push(thenCallback(i+1));promiseSetters.push(promiseSetter(i+1));}
reject=function(reason){this._reject(reason);};}}
Promise.join=function(){var last=arguments.length-1;var fn;if(last>0&&typeof arguments[last]==="function"){fn=arguments[last];if(!false){if(last<=8&&canEvaluate){var ret=new Promise(INTERNAL);ret._captureStackTrace();var HolderClass=holderClasses[last-1];var holder=new HolderClass(fn);var callbacks=thenCallbacks;for(var i=0;i<last;++i){var maybePromise=tryConvertToPromise(arguments[i],ret);if(maybePromise instanceof Promise){maybePromise=maybePromise._target();var bitField=maybePromise._bitField;;if(((bitField&50397184)===0)){maybePromise._then(callbacks[i],reject,undefined,ret,holder);promiseSetters[i](maybePromise,holder);holder.asyncNeeded=false;}else if(((bitField&33554432)!==0)){callbacks[i].call(ret,maybePromise._value(),holder);}else if(((bitField&16777216)!==0)){ret._reject(maybePromise._reason());}else{ret._cancel();}}else{callbacks[i].call(ret,maybePromise,holder);}}
if(!ret._isFateSealed()){if(holder.asyncNeeded){var domain=getDomain();if(domain!==null){holder.fn=util.domainBind(domain,holder.fn);}}
ret._setAsyncGuaranteed();ret._setOnCancel(holder);}
return ret;}}}
var $_len=arguments.length;var args=new Array($_len);for(var $_i=0;$_i<$_len;++$_i){args[$_i]=arguments[$_i];};if(fn)args.pop();var ret=new PromiseArray(args).promise();return fn!==undefined?ret.spread(fn):ret;};};},{"./util":74}],56:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,apiRejection,tryConvertToPromise,INTERNAL,debug){var getDomain=Promise._getDomain;var util=require("./util");var tryCatch=util.tryCatch;var errorObj=util.errorObj;var async=Promise._async;function MappingPromiseArray(promises,fn,limit,_filter){this.constructor$(promises);this._promise._captureStackTrace();var domain=getDomain();this._callback=domain===null?fn:util.domainBind(domain,fn);this._preservedValues=_filter===INTERNAL?new Array(this.length()):null;this._limit=limit;this._inFlight=0;this._queue=[];async.invoke(this._asyncInit,this,undefined);}
util.inherits(MappingPromiseArray,PromiseArray);MappingPromiseArray.prototype._asyncInit=function(){this._init$(undefined,-2);};MappingPromiseArray.prototype._init=function(){};MappingPromiseArray.prototype._promiseFulfilled=function(value,index){var values=this._values;var length=this.length();var preservedValues=this._preservedValues;var limit=this._limit;if(index<0){index=(index*-1)-1;values[index]=value;if(limit>=1){this._inFlight--;this._drainQueue();if(this._isResolved())return true;}}else{if(limit>=1&&this._inFlight>=limit){values[index]=value;this._queue.push(index);return false;}
if(preservedValues!==null)preservedValues[index]=value;var promise=this._promise;var callback=this._callback;var receiver=promise._boundValue();promise._pushContext();var ret=tryCatch(callback).call(receiver,value,index,length);var promiseCreated=promise._popContext();debug.checkForgottenReturns(ret,promiseCreated,preservedValues!==null?"Promise.filter":"Promise.map",promise);if(ret===errorObj){this._reject(ret.e);return true;}
var maybePromise=tryConvertToPromise(ret,this._promise);if(maybePromise instanceof Promise){maybePromise=maybePromise._target();var bitField=maybePromise._bitField;;if(((bitField&50397184)===0)){if(limit>=1)this._inFlight++;values[index]=maybePromise;maybePromise._proxy(this,(index+1)*-1);return false;}else if(((bitField&33554432)!==0)){ret=maybePromise._value();}else if(((bitField&16777216)!==0)){this._reject(maybePromise._reason());return true;}else{this._cancel();return true;}}
values[index]=ret;}
var totalResolved=++this._totalResolved;if(totalResolved>=length){if(preservedValues!==null){this._filter(values,preservedValues);}else{this._resolve(values);}
return true;}
return false;};MappingPromiseArray.prototype._drainQueue=function(){var queue=this._queue;var limit=this._limit;var values=this._values;while(queue.length>0&&this._inFlight<limit){if(this._isResolved())return;var index=queue.pop();this._promiseFulfilled(values[index],index);}};MappingPromiseArray.prototype._filter=function(booleans,values){var len=values.length;var ret=new Array(len);var j=0;for(var i=0;i<len;++i){if(booleans[i])ret[j++]=values[i];}
ret.length=j;this._resolve(ret);};MappingPromiseArray.prototype.preservedValues=function(){return this._preservedValues;};function map(promises,fn,options,_filter){if(typeof fn!=="function"){return apiRejection("expecting a function but got "+util.classString(fn));}
var limit=0;if(options!==undefined){if(typeof options==="object"&&options!==null){if(typeof options.concurrency!=="number"){return Promise.reject(new TypeError("'concurrency' must be a number but it is "+
util.classString(options.concurrency)));}
limit=options.concurrency;}else{return Promise.reject(new TypeError("options argument must be an object but it is "+
util.classString(options)));}}
limit=typeof limit==="number"&&isFinite(limit)&&limit>=1?limit:0;return new MappingPromiseArray(promises,fn,limit,_filter).promise();}
Promise.prototype.map=function(fn,options){return map(this,fn,options,null);};Promise.map=function(promises,fn,options,_filter){return map(promises,fn,options,_filter);};};},{"./util":74}],57:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL,tryConvertToPromise,apiRejection,debug){var util=require("./util");var tryCatch=util.tryCatch;Promise.method=function(fn){if(typeof fn!=="function"){throw new Promise.TypeError("expecting a function but got "+util.classString(fn));}
return function(){var ret=new Promise(INTERNAL);ret._captureStackTrace();ret._pushContext();var value=tryCatch(fn).apply(this,arguments);var promiseCreated=ret._popContext();debug.checkForgottenReturns(value,promiseCreated,"Promise.method",ret);ret._resolveFromSyncValue(value);return ret;};};Promise.attempt=Promise["try"]=function(fn){if(typeof fn!=="function"){return apiRejection("expecting a function but got "+util.classString(fn));}
var ret=new Promise(INTERNAL);ret._captureStackTrace();ret._pushContext();var value;if(arguments.length>1){debug.deprecated("calling Promise.try with more than 1 argument");var arg=arguments[1];var ctx=arguments[2];value=util.isArray(arg)?tryCatch(fn).apply(ctx,arg):tryCatch(fn).call(ctx,arg);}else{value=tryCatch(fn)();}
var promiseCreated=ret._popContext();debug.checkForgottenReturns(value,promiseCreated,"Promise.try",ret);ret._resolveFromSyncValue(value);return ret;};Promise.prototype._resolveFromSyncValue=function(value){if(value===util.errorObj){this._rejectCallback(value.e,false);}else{this._resolveCallback(value,true);}};};},{"./util":74}],58:[function(require,module,exports){"use strict";var util=require("./util");var maybeWrapAsError=util.maybeWrapAsError;var errors=require("./errors");var OperationalError=errors.OperationalError;var es5=require("./es5");function isUntypedError(obj){return obj instanceof Error&&es5.getPrototypeOf(obj)===Error.prototype;}
var rErrorKey=/^(?:name|message|stack|cause)$/;function wrapAsOperationalError(obj){var ret;if(isUntypedError(obj)){ret=new OperationalError(obj);ret.name=obj.name;ret.message=obj.message;ret.stack=obj.stack;var keys=es5.keys(obj);for(var i=0;i<keys.length;++i){var key=keys[i];if(!rErrorKey.test(key)){ret[key]=obj[key];}}
return ret;}
util.markAsOriginatingFromRejection(obj);return obj;}
function nodebackForPromise(promise,multiArgs){return function(err,value){if(promise===null)return;if(err){var wrapped=wrapAsOperationalError(maybeWrapAsError(err));promise._attachExtraTrace(wrapped);promise._reject(wrapped);}else if(!multiArgs){promise._fulfill(value);}else{var $_len=arguments.length;var args=new Array(Math.max($_len-1,0));for(var $_i=1;$_i<$_len;++$_i){args[$_i-1]=arguments[$_i];};promise._fulfill(args);}
promise=null;};}
module.exports=nodebackForPromise;},{"./errors":50,"./es5":51,"./util":74}],59:[function(require,module,exports){"use strict";module.exports=function(Promise){var util=require("./util");var async=Promise._async;var tryCatch=util.tryCatch;var errorObj=util.errorObj;function spreadAdapter(val,nodeback){var promise=this;if(!util.isArray(val))return successAdapter.call(promise,val,nodeback);var ret=tryCatch(nodeback).apply(promise._boundValue(),[null].concat(val));if(ret===errorObj){async.throwLater(ret.e);}}
function successAdapter(val,nodeback){var promise=this;var receiver=promise._boundValue();var ret=val===undefined?tryCatch(nodeback).call(receiver,null):tryCatch(nodeback).call(receiver,null,val);if(ret===errorObj){async.throwLater(ret.e);}}
function errorAdapter(reason,nodeback){var promise=this;if(!reason){var newReason=new Error(reason+"");newReason.cause=reason;reason=newReason;}
var ret=tryCatch(nodeback).call(promise._boundValue(),reason);if(ret===errorObj){async.throwLater(ret.e);}}
Promise.prototype.asCallback=Promise.prototype.nodeify=function(nodeback,options){if(typeof nodeback=="function"){var adapter=successAdapter;if(options!==undefined&&Object(options).spread){adapter=spreadAdapter;}
this._then(adapter,errorAdapter,undefined,this,nodeback);}
return this;};};},{"./util":74}],60:[function(require,module,exports){(function(process){"use strict";module.exports=function(){var makeSelfResolutionError=function(){return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");};var reflectHandler=function(){return new Promise.PromiseInspection(this._target());};var apiRejection=function(msg){return Promise.reject(new TypeError(msg));};function Proxyable(){}
var UNDEFINED_BINDING={};var util=require("./util");var getDomain;if(util.isNode){getDomain=function(){var ret=process.domain;if(ret===undefined)ret=null;return ret;};}else{getDomain=function(){return null;};}
util.notEnumerableProp(Promise,"_getDomain",getDomain);var es5=require("./es5");var Async=require("./async");var async=new Async();es5.defineProperty(Promise,"_async",{value:async});var errors=require("./errors");var TypeError=Promise.TypeError=errors.TypeError;Promise.RangeError=errors.RangeError;var CancellationError=Promise.CancellationError=errors.CancellationError;Promise.TimeoutError=errors.TimeoutError;Promise.OperationalError=errors.OperationalError;Promise.RejectionError=errors.OperationalError;Promise.AggregateError=errors.AggregateError;var INTERNAL=function(){};var APPLY={};var NEXT_FILTER={};var tryConvertToPromise=require("./thenables")(Promise,INTERNAL);var PromiseArray=require("./promise_array")(Promise,INTERNAL,tryConvertToPromise,apiRejection,Proxyable);var Context=require("./context")(Promise);var createContext=Context.create;var debug=require("./debuggability")(Promise,Context);var CapturedTrace=debug.CapturedTrace;var PassThroughHandlerContext=require("./finally")(Promise,tryConvertToPromise);var catchFilter=require("./catch_filter")(NEXT_FILTER);var nodebackForPromise=require("./nodeback");var errorObj=util.errorObj;var tryCatch=util.tryCatch;function check(self,executor){if(typeof executor!=="function"){throw new TypeError("expecting a function but got "+util.classString(executor));}
if(self.constructor!==Promise){throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}}
function Promise(executor){this._bitField=0;this._fulfillmentHandler0=undefined;this._rejectionHandler0=undefined;this._promise0=undefined;this._receiver0=undefined;if(executor!==INTERNAL){check(this,executor);this._resolveFromExecutor(executor);}
this._promiseCreated();this._fireEvent("promiseCreated",this);}
Promise.prototype.toString=function(){return "[object Promise]";};Promise.prototype.caught=Promise.prototype["catch"]=function(fn){var len=arguments.length;if(len>1){var catchInstances=new Array(len-1),j=0,i;for(i=0;i<len-1;++i){var item=arguments[i];if(util.isObject(item)){catchInstances[j++]=item;}else{return apiRejection("expecting an object but got "+
"A catch statement predicate "+util.classString(item));}}
catchInstances.length=j;fn=arguments[i];return this.then(undefined,catchFilter(catchInstances,fn,this));}
return this.then(undefined,fn);};Promise.prototype.reflect=function(){return this._then(reflectHandler,reflectHandler,undefined,this,undefined);};Promise.prototype.then=function(didFulfill,didReject){if(debug.warnings()&&arguments.length>0&&typeof didFulfill!=="function"&&typeof didReject!=="function"){var msg=".then() only accepts functions but was passed: "+
util.classString(didFulfill);if(arguments.length>1){msg+=", "+util.classString(didReject);}
this._warn(msg);}
return this._then(didFulfill,didReject,undefined,undefined,undefined);};Promise.prototype.done=function(didFulfill,didReject){var promise=this._then(didFulfill,didReject,undefined,undefined,undefined);promise._setIsFinal();};Promise.prototype.spread=function(fn){if(typeof fn!=="function"){return apiRejection("expecting a function but got "+util.classString(fn));}
return this.all()._then(fn,undefined,undefined,APPLY,undefined);};Promise.prototype.toJSON=function(){var ret={isFulfilled:false,isRejected:false,fulfillmentValue:undefined,rejectionReason:undefined};if(this.isFulfilled()){ret.fulfillmentValue=this.value();ret.isFulfilled=true;}else if(this.isRejected()){ret.rejectionReason=this.reason();ret.isRejected=true;}
return ret;};Promise.prototype.all=function(){if(arguments.length>0){this._warn(".all() was passed arguments but it does not take any");}
return new PromiseArray(this).promise();};Promise.prototype.error=function(fn){return this.caught(util.originatesFromRejection,fn);};Promise.getNewLibraryCopy=module.exports;Promise.is=function(val){return val instanceof Promise;};Promise.fromNode=Promise.fromCallback=function(fn){var ret=new Promise(INTERNAL);ret._captureStackTrace();var multiArgs=arguments.length>1?!!Object(arguments[1]).multiArgs:false;var result=tryCatch(fn)(nodebackForPromise(ret,multiArgs));if(result===errorObj){ret._rejectCallback(result.e,true);}
if(!ret._isFateSealed())ret._setAsyncGuaranteed();return ret;};Promise.all=function(promises){return new PromiseArray(promises).promise();};Promise.cast=function(obj){var ret=tryConvertToPromise(obj);if(!(ret instanceof Promise)){ret=new Promise(INTERNAL);ret._captureStackTrace();ret._setFulfilled();ret._rejectionHandler0=obj;}
return ret;};Promise.resolve=Promise.fulfilled=Promise.cast;Promise.reject=Promise.rejected=function(reason){var ret=new Promise(INTERNAL);ret._captureStackTrace();ret._rejectCallback(reason,true);return ret;};Promise.setScheduler=function(fn){if(typeof fn!=="function"){throw new TypeError("expecting a function but got "+util.classString(fn));}
return async.setScheduler(fn);};Promise.prototype._then=function(didFulfill,didReject,_,receiver,internalData){var haveInternalData=internalData!==undefined;var promise=haveInternalData?internalData:new Promise(INTERNAL);var target=this._target();var bitField=target._bitField;if(!haveInternalData){promise._propagateFrom(this,3);promise._captureStackTrace();if(receiver===undefined&&((this._bitField&2097152)!==0)){if(!((bitField&50397184)===0)){receiver=this._boundValue();}else{receiver=target===this?undefined:this._boundTo;}}
this._fireEvent("promiseChained",this,promise);}
var domain=getDomain();if(!((bitField&50397184)===0)){var handler,value,settler=target._settlePromiseCtx;if(((bitField&33554432)!==0)){value=target._rejectionHandler0;handler=didFulfill;}else if(((bitField&16777216)!==0)){value=target._fulfillmentHandler0;handler=didReject;target._unsetRejectionIsUnhandled();}else{settler=target._settlePromiseLateCancellationObserver;value=new CancellationError("late cancellation observer");target._attachExtraTrace(value);handler=didReject;}
async.invoke(settler,target,{handler:domain===null?handler:(typeof handler==="function"&&util.domainBind(domain,handler)),promise:promise,receiver:receiver,value:value});}else{target._addCallbacks(didFulfill,didReject,promise,receiver,domain);}
return promise;};Promise.prototype._length=function(){return this._bitField&65535;};Promise.prototype._isFateSealed=function(){return(this._bitField&117506048)!==0;};Promise.prototype._isFollowing=function(){return(this._bitField&67108864)===67108864;};Promise.prototype._setLength=function(len){this._bitField=(this._bitField&-65536)|(len&65535);};Promise.prototype._setFulfilled=function(){this._bitField=this._bitField|33554432;this._fireEvent("promiseFulfilled",this);};Promise.prototype._setRejected=function(){this._bitField=this._bitField|16777216;this._fireEvent("promiseRejected",this);};Promise.prototype._setFollowing=function(){this._bitField=this._bitField|67108864;this._fireEvent("promiseResolved",this);};Promise.prototype._setIsFinal=function(){this._bitField=this._bitField|4194304;};Promise.prototype._isFinal=function(){return(this._bitField&4194304)>0;};Promise.prototype._unsetCancelled=function(){this._bitField=this._bitField&(~65536);};Promise.prototype._setCancelled=function(){this._bitField=this._bitField|65536;this._fireEvent("promiseCancelled",this);};Promise.prototype._setWillBeCancelled=function(){this._bitField=this._bitField|8388608;};Promise.prototype._setAsyncGuaranteed=function(){if(async.hasCustomScheduler())return;this._bitField=this._bitField|134217728;};Promise.prototype._receiverAt=function(index){var ret=index===0?this._receiver0:this[index*4-4+3];if(ret===UNDEFINED_BINDING){return undefined;}else if(ret===undefined&&this._isBound()){return this._boundValue();}
return ret;};Promise.prototype._promiseAt=function(index){return this[index*4-4+2];};Promise.prototype._fulfillmentHandlerAt=function(index){return this[index*4-4+0];};Promise.prototype._rejectionHandlerAt=function(index){return this[index*4-4+1];};Promise.prototype._boundValue=function(){};Promise.prototype._migrateCallback0=function(follower){var bitField=follower._bitField;var fulfill=follower._fulfillmentHandler0;var reject=follower._rejectionHandler0;var promise=follower._promise0;var receiver=follower._receiverAt(0);if(receiver===undefined)receiver=UNDEFINED_BINDING;this._addCallbacks(fulfill,reject,promise,receiver,null);};Promise.prototype._migrateCallbackAt=function(follower,index){var fulfill=follower._fulfillmentHandlerAt(index);var reject=follower._rejectionHandlerAt(index);var promise=follower._promiseAt(index);var receiver=follower._receiverAt(index);if(receiver===undefined)receiver=UNDEFINED_BINDING;this._addCallbacks(fulfill,reject,promise,receiver,null);};Promise.prototype._addCallbacks=function(fulfill,reject,promise,receiver,domain){var index=this._length();if(index>=65535-4){index=0;this._setLength(0);}
if(index===0){this._promise0=promise;this._receiver0=receiver;if(typeof fulfill==="function"){this._fulfillmentHandler0=domain===null?fulfill:util.domainBind(domain,fulfill);}
if(typeof reject==="function"){this._rejectionHandler0=domain===null?reject:util.domainBind(domain,reject);}}else{var base=index*4-4;this[base+2]=promise;this[base+3]=receiver;if(typeof fulfill==="function"){this[base+0]=domain===null?fulfill:util.domainBind(domain,fulfill);}
if(typeof reject==="function"){this[base+1]=domain===null?reject:util.domainBind(domain,reject);}}
this._setLength(index+1);return index;};Promise.prototype._proxy=function(proxyable,arg){this._addCallbacks(undefined,undefined,arg,proxyable,null);};Promise.prototype._resolveCallback=function(value,shouldBind){if(((this._bitField&117506048)!==0))return;if(value===this)
return this._rejectCallback(makeSelfResolutionError(),false);var maybePromise=tryConvertToPromise(value,this);if(!(maybePromise instanceof Promise))return this._fulfill(value);if(shouldBind)this._propagateFrom(maybePromise,2);var promise=maybePromise._target();if(promise===this){this._reject(makeSelfResolutionError());return;}
var bitField=promise._bitField;if(((bitField&50397184)===0)){var len=this._length();if(len>0)promise._migrateCallback0(this);for(var i=1;i<len;++i){promise._migrateCallbackAt(this,i);}
this._setFollowing();this._setLength(0);this._setFollowee(promise);}else if(((bitField&33554432)!==0)){this._fulfill(promise._value());}else if(((bitField&16777216)!==0)){this._reject(promise._reason());}else{var reason=new CancellationError("late cancellation observer");promise._attachExtraTrace(reason);this._reject(reason);}};Promise.prototype._rejectCallback=function(reason,synchronous,ignoreNonErrorWarnings){var trace=util.ensureErrorObject(reason);var hasStack=trace===reason;if(!hasStack&&!ignoreNonErrorWarnings&&debug.warnings()){var message="a promise was rejected with a non-error: "+
util.classString(reason);this._warn(message,true);}
this._attachExtraTrace(trace,synchronous?hasStack:false);this._reject(reason);};Promise.prototype._resolveFromExecutor=function(executor){var promise=this;this._captureStackTrace();this._pushContext();var synchronous=true;var r=this._execute(executor,function(value){promise._resolveCallback(value);},function(reason){promise._rejectCallback(reason,synchronous);});synchronous=false;this._popContext();if(r!==undefined){promise._rejectCallback(r,true);}};Promise.prototype._settlePromiseFromHandler=function(handler,receiver,value,promise){var bitField=promise._bitField;if(((bitField&65536)!==0))return;promise._pushContext();var x;if(receiver===APPLY){if(!value||typeof value.length!=="number"){x=errorObj;x.e=new TypeError("cannot .spread() a non-array: "+
util.classString(value));}else{x=tryCatch(handler).apply(this._boundValue(),value);}}else{x=tryCatch(handler).call(receiver,value);}
var promiseCreated=promise._popContext();bitField=promise._bitField;if(((bitField&65536)!==0))return;if(x===NEXT_FILTER){promise._reject(value);}else if(x===errorObj){promise._rejectCallback(x.e,false);}else{debug.checkForgottenReturns(x,promiseCreated,"",promise,this);promise._resolveCallback(x);}};Promise.prototype._target=function(){var ret=this;while(ret._isFollowing())ret=ret._followee();return ret;};Promise.prototype._followee=function(){return this._rejectionHandler0;};Promise.prototype._setFollowee=function(promise){this._rejectionHandler0=promise;};Promise.prototype._settlePromise=function(promise,handler,receiver,value){var isPromise=promise instanceof Promise;var bitField=this._bitField;var asyncGuaranteed=((bitField&134217728)!==0);if(((bitField&65536)!==0)){if(isPromise)promise._invokeInternalOnCancel();if(receiver instanceof PassThroughHandlerContext&&receiver.isFinallyHandler()){receiver.cancelPromise=promise;if(tryCatch(handler).call(receiver,value)===errorObj){promise._reject(errorObj.e);}}else if(handler===reflectHandler){promise._fulfill(reflectHandler.call(receiver));}else if(receiver instanceof Proxyable){receiver._promiseCancelled(promise);}else if(isPromise||promise instanceof PromiseArray){promise._cancel();}else{receiver.cancel();}}else if(typeof handler==="function"){if(!isPromise){handler.call(receiver,value,promise);}else{if(asyncGuaranteed)promise._setAsyncGuaranteed();this._settlePromiseFromHandler(handler,receiver,value,promise);}}else if(receiver instanceof Proxyable){if(!receiver._isResolved()){if(((bitField&33554432)!==0)){receiver._promiseFulfilled(value,promise);}else{receiver._promiseRejected(value,promise);}}}else if(isPromise){if(asyncGuaranteed)promise._setAsyncGuaranteed();if(((bitField&33554432)!==0)){promise._fulfill(value);}else{promise._reject(value);}}};Promise.prototype._settlePromiseLateCancellationObserver=function(ctx){var handler=ctx.handler;var promise=ctx.promise;var receiver=ctx.receiver;var value=ctx.value;if(typeof handler==="function"){if(!(promise instanceof Promise)){handler.call(receiver,value,promise);}else{this._settlePromiseFromHandler(handler,receiver,value,promise);}}else if(promise instanceof Promise){promise._reject(value);}};Promise.prototype._settlePromiseCtx=function(ctx){this._settlePromise(ctx.promise,ctx.handler,ctx.receiver,ctx.value);};Promise.prototype._settlePromise0=function(handler,value,bitField){var promise=this._promise0;var receiver=this._receiverAt(0);this._promise0=undefined;this._receiver0=undefined;this._settlePromise(promise,handler,receiver,value);};Promise.prototype._clearCallbackDataAtIndex=function(index){var base=index*4-4;this[base+2]=this[base+3]=this[base+0]=this[base+1]=undefined;};Promise.prototype._fulfill=function(value){var bitField=this._bitField;if(((bitField&117506048)>>>16))return;if(value===this){var err=makeSelfResolutionError();this._attachExtraTrace(err);return this._reject(err);}
this._setFulfilled();this._rejectionHandler0=value;if((bitField&65535)>0){if(((bitField&134217728)!==0)){this._settlePromises();}else{async.settlePromises(this);}}};Promise.prototype._reject=function(reason){var bitField=this._bitField;if(((bitField&117506048)>>>16))return;this._setRejected();this._fulfillmentHandler0=reason;if(this._isFinal()){return async.fatalError(reason,util.isNode);}
if((bitField&65535)>0){async.settlePromises(this);}else{this._ensurePossibleRejectionHandled();}};Promise.prototype._fulfillPromises=function(len,value){for(var i=1;i<len;i++){var handler=this._fulfillmentHandlerAt(i);var promise=this._promiseAt(i);var receiver=this._receiverAt(i);this._clearCallbackDataAtIndex(i);this._settlePromise(promise,handler,receiver,value);}};Promise.prototype._rejectPromises=function(len,reason){for(var i=1;i<len;i++){var handler=this._rejectionHandlerAt(i);var promise=this._promiseAt(i);var receiver=this._receiverAt(i);this._clearCallbackDataAtIndex(i);this._settlePromise(promise,handler,receiver,reason);}};Promise.prototype._settlePromises=function(){var bitField=this._bitField;var len=(bitField&65535);if(len>0){if(((bitField&16842752)!==0)){var reason=this._fulfillmentHandler0;this._settlePromise0(this._rejectionHandler0,reason,bitField);this._rejectPromises(len,reason);}else{var value=this._rejectionHandler0;this._settlePromise0(this._fulfillmentHandler0,value,bitField);this._fulfillPromises(len,value);}
this._setLength(0);}
this._clearCancellationData();};Promise.prototype._settledValue=function(){var bitField=this._bitField;if(((bitField&33554432)!==0)){return this._rejectionHandler0;}else if(((bitField&16777216)!==0)){return this._fulfillmentHandler0;}};function deferResolve(v){this.promise._resolveCallback(v);}
function deferReject(v){this.promise._rejectCallback(v,false);}
Promise.defer=Promise.pending=function(){debug.deprecated("Promise.defer","new Promise");var promise=new Promise(INTERNAL);return{promise:promise,resolve:deferResolve,reject:deferReject};};util.notEnumerableProp(Promise,"_makeSelfResolutionError",makeSelfResolutionError);require("./method")(Promise,INTERNAL,tryConvertToPromise,apiRejection,debug);require("./bind")(Promise,INTERNAL,tryConvertToPromise,debug);require("./cancel")(Promise,PromiseArray,apiRejection,debug);require("./direct_resolve")(Promise);require("./synchronous_inspection")(Promise);require("./join")(Promise,PromiseArray,tryConvertToPromise,INTERNAL,async,getDomain);Promise.Promise=Promise;Promise.version="3.4.7";require('./map.js')(Promise,PromiseArray,apiRejection,tryConvertToPromise,INTERNAL,debug);require('./call_get.js')(Promise);require('./using.js')(Promise,apiRejection,tryConvertToPromise,createContext,INTERNAL,debug);require('./timers.js')(Promise,INTERNAL,debug);require('./generators.js')(Promise,apiRejection,INTERNAL,tryConvertToPromise,Proxyable,debug);require('./nodeify.js')(Promise);require('./promisify.js')(Promise,INTERNAL);require('./props.js')(Promise,PromiseArray,tryConvertToPromise,apiRejection);require('./race.js')(Promise,INTERNAL,tryConvertToPromise,apiRejection);require('./reduce.js')(Promise,PromiseArray,apiRejection,tryConvertToPromise,INTERNAL,debug);require('./settle.js')(Promise,PromiseArray,debug);require('./some.js')(Promise,PromiseArray,apiRejection);require('./filter.js')(Promise,INTERNAL);require('./each.js')(Promise,INTERNAL);require('./any.js')(Promise);util.toFastProperties(Promise);util.toFastProperties(Promise.prototype);function fillTypes(value){var p=new Promise(INTERNAL);p._fulfillmentHandler0=value;p._rejectionHandler0=value;p._promise0=value;p._receiver0=value;}
fillTypes({a:1});fillTypes({b:2});fillTypes({c:3});fillTypes(1);fillTypes(function(){});fillTypes(undefined);fillTypes(false);fillTypes(new Promise(INTERNAL));debug.setBounds(Async.firstLineError,util.lastLineError);return Promise;};}).call(this,require('_process'))},{"./any.js":40,"./async":41,"./bind":42,"./call_get.js":43,"./cancel":44,"./catch_filter":45,"./context":46,"./debuggability":47,"./direct_resolve":48,"./each.js":49,"./errors":50,"./es5":51,"./filter.js":52,"./finally":53,"./generators.js":54,"./join":55,"./map.js":56,"./method":57,"./nodeback":58,"./nodeify.js":59,"./promise_array":61,"./promisify.js":62,"./props.js":63,"./race.js":65,"./reduce.js":66,"./settle.js":68,"./some.js":69,"./synchronous_inspection":70,"./thenables":71,"./timers.js":72,"./using.js":73,"./util":74,"_process":138}],61:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL,tryConvertToPromise,apiRejection,Proxyable){var util=require("./util");var isArray=util.isArray;function toResolutionValue(val){switch(val){case-2:return[];case-3:return{};}}
function PromiseArray(values){var promise=this._promise=new Promise(INTERNAL);if(values instanceof Promise){promise._propagateFrom(values,3);}
promise._setOnCancel(this);this._values=values;this._length=0;this._totalResolved=0;this._init(undefined,-2);}
util.inherits(PromiseArray,Proxyable);PromiseArray.prototype.length=function(){return this._length;};PromiseArray.prototype.promise=function(){return this._promise;};PromiseArray.prototype._init=function init(_,resolveValueIfEmpty){var values=tryConvertToPromise(this._values,this._promise);if(values instanceof Promise){values=values._target();var bitField=values._bitField;;this._values=values;if(((bitField&50397184)===0)){this._promise._setAsyncGuaranteed();return values._then(init,this._reject,undefined,this,resolveValueIfEmpty);}else if(((bitField&33554432)!==0)){values=values._value();}else if(((bitField&16777216)!==0)){return this._reject(values._reason());}else{return this._cancel();}}
values=util.asArray(values);if(values===null){var err=apiRejection("expecting an array or an iterable object but got "+util.classString(values)).reason();this._promise._rejectCallback(err,false);return;}
if(values.length===0){if(resolveValueIfEmpty===-5){this._resolveEmptyArray();}
else{this._resolve(toResolutionValue(resolveValueIfEmpty));}
return;}
this._iterate(values);};PromiseArray.prototype._iterate=function(values){var len=this.getActualLength(values.length);this._length=len;this._values=this.shouldCopyValues()?new Array(len):this._values;var result=this._promise;var isResolved=false;var bitField=null;for(var i=0;i<len;++i){var maybePromise=tryConvertToPromise(values[i],result);if(maybePromise instanceof Promise){maybePromise=maybePromise._target();bitField=maybePromise._bitField;}else{bitField=null;}
if(isResolved){if(bitField!==null){maybePromise.suppressUnhandledRejections();}}else if(bitField!==null){if(((bitField&50397184)===0)){maybePromise._proxy(this,i);this._values[i]=maybePromise;}else if(((bitField&33554432)!==0)){isResolved=this._promiseFulfilled(maybePromise._value(),i);}else if(((bitField&16777216)!==0)){isResolved=this._promiseRejected(maybePromise._reason(),i);}else{isResolved=this._promiseCancelled(i);}}else{isResolved=this._promiseFulfilled(maybePromise,i);}}
if(!isResolved)result._setAsyncGuaranteed();};PromiseArray.prototype._isResolved=function(){return this._values===null;};PromiseArray.prototype._resolve=function(value){this._values=null;this._promise._fulfill(value);};PromiseArray.prototype._cancel=function(){if(this._isResolved()||!this._promise._isCancellable())return;this._values=null;this._promise._cancel();};PromiseArray.prototype._reject=function(reason){this._values=null;this._promise._rejectCallback(reason,false);};PromiseArray.prototype._promiseFulfilled=function(value,index){this._values[index]=value;var totalResolved=++this._totalResolved;if(totalResolved>=this._length){this._resolve(this._values);return true;}
return false;};PromiseArray.prototype._promiseCancelled=function(){this._cancel();return true;};PromiseArray.prototype._promiseRejected=function(reason){this._totalResolved++;this._reject(reason);return true;};PromiseArray.prototype._resultCancelled=function(){if(this._isResolved())return;var values=this._values;this._cancel();if(values instanceof Promise){values.cancel();}else{for(var i=0;i<values.length;++i){if(values[i]instanceof Promise){values[i].cancel();}}}};PromiseArray.prototype.shouldCopyValues=function(){return true;};PromiseArray.prototype.getActualLength=function(len){return len;};return PromiseArray;};},{"./util":74}],62:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL){var THIS={};var util=require("./util");var nodebackForPromise=require("./nodeback");var withAppended=util.withAppended;var maybeWrapAsError=util.maybeWrapAsError;var canEvaluate=util.canEvaluate;var TypeError=require("./errors").TypeError;var defaultSuffix="Async";var defaultPromisified={__isPromisified__:true};var noCopyProps=["arity","length","name","arguments","caller","callee","prototype","__isPromisified__"];var noCopyPropsPattern=new RegExp("^(?:"+noCopyProps.join("|")+")$");var defaultFilter=function(name){return util.isIdentifier(name)&&name.charAt(0)!=="_"&&name!=="constructor";};function propsFilter(key){return!noCopyPropsPattern.test(key);}
function isPromisified(fn){try{return fn.__isPromisified__===true;}
catch(e){return false;}}
function hasPromisified(obj,key,suffix){var val=util.getDataPropertyOrDefault(obj,key+suffix,defaultPromisified);return val?isPromisified(val):false;}
function checkValid(ret,suffix,suffixRegexp){for(var i=0;i<ret.length;i+=2){var key=ret[i];if(suffixRegexp.test(key)){var keyWithoutAsyncSuffix=key.replace(suffixRegexp,"");for(var j=0;j<ret.length;j+=2){if(ret[j]===keyWithoutAsyncSuffix){throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a".replace("%s",suffix));}}}}}
function promisifiableMethods(obj,suffix,suffixRegexp,filter){var keys=util.inheritedDataKeys(obj);var ret=[];for(var i=0;i<keys.length;++i){var key=keys[i];var value=obj[key];var passesDefaultFilter=filter===defaultFilter?true:defaultFilter(key,value,obj);if(typeof value==="function"&&!isPromisified(value)&&!hasPromisified(obj,key,suffix)&&filter(key,value,obj,passesDefaultFilter)){ret.push(key,value);}}
checkValid(ret,suffix,suffixRegexp);return ret;}
var escapeIdentRegex=function(str){return str.replace(/([$])/,"\\$");};var makeNodePromisifiedEval;if(!false){var switchCaseArgumentOrder=function(likelyArgumentCount){var ret=[likelyArgumentCount];var min=Math.max(0,likelyArgumentCount-1-3);for(var i=likelyArgumentCount-1;i>=min;--i){ret.push(i);}
for(var i=likelyArgumentCount+1;i<=3;++i){ret.push(i);}
return ret;};var argumentSequence=function(argumentCount){return util.filledRange(argumentCount,"_arg","");};var parameterDeclaration=function(parameterCount){return util.filledRange(Math.max(parameterCount,3),"_arg","");};var parameterCount=function(fn){if(typeof fn.length==="number"){return Math.max(Math.min(fn.length,1023+1),0);}
return 0;};makeNodePromisifiedEval=function(callback,receiver,originalName,fn,_,multiArgs){var newParameterCount=Math.max(0,parameterCount(fn)-1);var argumentOrder=switchCaseArgumentOrder(newParameterCount);var shouldProxyThis=typeof callback==="string"||receiver===THIS;function generateCallForArgumentCount(count){var args=argumentSequence(count).join(", ");var comma=count>0?", ":"";var ret;if(shouldProxyThis){ret="ret = callback.call(this, {{args}}, nodeback); break;\n";}else{ret=receiver===undefined?"ret = callback({{args}}, nodeback); break;\n":"ret = callback.call(receiver, {{args}}, nodeback); break;\n";}
return ret.replace("{{args}}",args).replace(", ",comma);}
function generateArgumentSwitchCase(){var ret="";for(var i=0;i<argumentOrder.length;++i){ret+="case "+argumentOrder[i]+":"+
generateCallForArgumentCount(argumentOrder[i]);}
ret+="                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]",(shouldProxyThis?"ret = callback.apply(this, args);\n":"ret = callback.apply(receiver, args);\n"));return ret;}
var getFunctionCode=typeof callback==="string"?("this != null ? this['"+callback+"'] : fn"):"fn";var body="'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, "+multiArgs+");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]",generateArgumentSwitchCase()).replace("[GetFunctionCode]",getFunctionCode);body=body.replace("Parameters",parameterDeclaration(newParameterCount));return new Function("Promise","fn","receiver","withAppended","maybeWrapAsError","nodebackForPromise","tryCatch","errorObj","notEnumerableProp","INTERNAL",body)(Promise,fn,receiver,withAppended,maybeWrapAsError,nodebackForPromise,util.tryCatch,util.errorObj,util.notEnumerableProp,INTERNAL);};}
function makeNodePromisifiedClosure(callback,receiver,_,fn,__,multiArgs){var defaultThis=(function(){return this;})();var method=callback;if(typeof method==="string"){callback=fn;}
function promisified(){var _receiver=receiver;if(receiver===THIS)_receiver=this;var promise=new Promise(INTERNAL);promise._captureStackTrace();var cb=typeof method==="string"&&this!==defaultThis?this[method]:callback;var fn=nodebackForPromise(promise,multiArgs);try{cb.apply(_receiver,withAppended(arguments,fn));}catch(e){promise._rejectCallback(maybeWrapAsError(e),true,true);}
if(!promise._isFateSealed())promise._setAsyncGuaranteed();return promise;}
util.notEnumerableProp(promisified,"__isPromisified__",true);return promisified;}
var makeNodePromisified=canEvaluate?makeNodePromisifiedEval:makeNodePromisifiedClosure;function promisifyAll(obj,suffix,filter,promisifier,multiArgs){var suffixRegexp=new RegExp(escapeIdentRegex(suffix)+"$");var methods=promisifiableMethods(obj,suffix,suffixRegexp,filter);for(var i=0,len=methods.length;i<len;i+=2){var key=methods[i];var fn=methods[i+1];var promisifiedKey=key+suffix;if(promisifier===makeNodePromisified){obj[promisifiedKey]=makeNodePromisified(key,THIS,key,fn,suffix,multiArgs);}else{var promisified=promisifier(fn,function(){return makeNodePromisified(key,THIS,key,fn,suffix,multiArgs);});util.notEnumerableProp(promisified,"__isPromisified__",true);obj[promisifiedKey]=promisified;}}
util.toFastProperties(obj);return obj;}
function promisify(callback,receiver,multiArgs){return makeNodePromisified(callback,receiver,undefined,callback,null,multiArgs);}
Promise.promisify=function(fn,options){if(typeof fn!=="function"){throw new TypeError("expecting a function but got "+util.classString(fn));}
if(isPromisified(fn)){return fn;}
options=Object(options);var receiver=options.context===undefined?THIS:options.context;var multiArgs=!!options.multiArgs;var ret=promisify(fn,receiver,multiArgs);util.copyDescriptors(fn,ret,propsFilter);return ret;};Promise.promisifyAll=function(target,options){if(typeof target!=="function"&&typeof target!=="object"){throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
options=Object(options);var multiArgs=!!options.multiArgs;var suffix=options.suffix;if(typeof suffix!=="string")suffix=defaultSuffix;var filter=options.filter;if(typeof filter!=="function")filter=defaultFilter;var promisifier=options.promisifier;if(typeof promisifier!=="function")promisifier=makeNodePromisified;if(!util.isIdentifier(suffix)){throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
var keys=util.inheritedDataKeys(target);for(var i=0;i<keys.length;++i){var value=target[keys[i]];if(keys[i]!=="constructor"&&util.isClass(value)){promisifyAll(value.prototype,suffix,filter,promisifier,multiArgs);promisifyAll(value,suffix,filter,promisifier,multiArgs);}}
return promisifyAll(target,suffix,filter,promisifier,multiArgs);};};},{"./errors":50,"./nodeback":58,"./util":74}],63:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,tryConvertToPromise,apiRejection){var util=require("./util");var isObject=util.isObject;var es5=require("./es5");var Es6Map;if(typeof Map==="function")Es6Map=Map;var mapToEntries=(function(){var index=0;var size=0;function extractEntry(value,key){this[index]=value;this[index+size]=key;index++;}
return function mapToEntries(map){size=map.size;index=0;var ret=new Array(map.size*2);map.forEach(extractEntry,ret);return ret;};})();var entriesToMap=function(entries){var ret=new Es6Map();var length=entries.length/2|0;for(var i=0;i<length;++i){var key=entries[length+i];var value=entries[i];ret.set(key,value);}
return ret;};function PropertiesPromiseArray(obj){var isMap=false;var entries;if(Es6Map!==undefined&&obj instanceof Es6Map){entries=mapToEntries(obj);isMap=true;}else{var keys=es5.keys(obj);var len=keys.length;entries=new Array(len*2);for(var i=0;i<len;++i){var key=keys[i];entries[i]=obj[key];entries[i+len]=key;}}
this.constructor$(entries);this._isMap=isMap;this._init$(undefined,-3);}
util.inherits(PropertiesPromiseArray,PromiseArray);PropertiesPromiseArray.prototype._init=function(){};PropertiesPromiseArray.prototype._promiseFulfilled=function(value,index){this._values[index]=value;var totalResolved=++this._totalResolved;if(totalResolved>=this._length){var val;if(this._isMap){val=entriesToMap(this._values);}else{val={};var keyOffset=this.length();for(var i=0,len=this.length();i<len;++i){val[this._values[i+keyOffset]]=this._values[i];}}
this._resolve(val);return true;}
return false;};PropertiesPromiseArray.prototype.shouldCopyValues=function(){return false;};PropertiesPromiseArray.prototype.getActualLength=function(len){return len>>1;};function props(promises){var ret;var castValue=tryConvertToPromise(promises);if(!isObject(castValue)){return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}else if(castValue instanceof Promise){ret=castValue._then(Promise.props,undefined,undefined,undefined,undefined);}else{ret=new PropertiesPromiseArray(castValue).promise();}
if(castValue instanceof Promise){ret._propagateFrom(castValue,2);}
return ret;}
Promise.prototype.props=function(){return props(this);};Promise.props=function(promises){return props(promises);};};},{"./es5":51,"./util":74}],64:[function(require,module,exports){"use strict";function arrayMove(src,srcIndex,dst,dstIndex,len){for(var j=0;j<len;++j){dst[j+dstIndex]=src[j+srcIndex];src[j+srcIndex]=void 0;}}
function Queue(capacity){this._capacity=capacity;this._length=0;this._front=0;}
Queue.prototype._willBeOverCapacity=function(size){return this._capacity<size;};Queue.prototype._pushOne=function(arg){var length=this.length();this._checkCapacity(length+1);var i=(this._front+length)&(this._capacity-1);this[i]=arg;this._length=length+1;};Queue.prototype.push=function(fn,receiver,arg){var length=this.length()+3;if(this._willBeOverCapacity(length)){this._pushOne(fn);this._pushOne(receiver);this._pushOne(arg);return;}
var j=this._front+length-3;this._checkCapacity(length);var wrapMask=this._capacity-1;this[(j+0)&wrapMask]=fn;this[(j+1)&wrapMask]=receiver;this[(j+2)&wrapMask]=arg;this._length=length;};Queue.prototype.shift=function(){var front=this._front,ret=this[front];this[front]=undefined;this._front=(front+1)&(this._capacity-1);this._length--;return ret;};Queue.prototype.length=function(){return this._length;};Queue.prototype._checkCapacity=function(size){if(this._capacity<size){this._resizeTo(this._capacity<<1);}};Queue.prototype._resizeTo=function(capacity){var oldCapacity=this._capacity;this._capacity=capacity;var front=this._front;var length=this._length;var moveItemsCount=(front+length)&(oldCapacity-1);arrayMove(this,0,this,oldCapacity,moveItemsCount);};module.exports=Queue;},{}],65:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL,tryConvertToPromise,apiRejection){var util=require("./util");var raceLater=function(promise){return promise.then(function(array){return race(array,promise);});};function race(promises,parent){var maybePromise=tryConvertToPromise(promises);if(maybePromise instanceof Promise){return raceLater(maybePromise);}else{promises=util.asArray(promises);if(promises===null)
return apiRejection("expecting an array or an iterable object but got "+util.classString(promises));}
var ret=new Promise(INTERNAL);if(parent!==undefined){ret._propagateFrom(parent,3);}
var fulfill=ret._fulfill;var reject=ret._reject;for(var i=0,len=promises.length;i<len;++i){var val=promises[i];if(val===undefined&&!(i in promises)){continue;}
Promise.cast(val)._then(fulfill,reject,undefined,ret,null);}
return ret;}
Promise.race=function(promises){return race(promises,undefined);};Promise.prototype.race=function(){return race(this,undefined);};};},{"./util":74}],66:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,apiRejection,tryConvertToPromise,INTERNAL,debug){var getDomain=Promise._getDomain;var util=require("./util");var tryCatch=util.tryCatch;function ReductionPromiseArray(promises,fn,initialValue,_each){this.constructor$(promises);var domain=getDomain();this._fn=domain===null?fn:util.domainBind(domain,fn);if(initialValue!==undefined){initialValue=Promise.resolve(initialValue);initialValue._attachCancellationCallback(this);}
this._initialValue=initialValue;this._currentCancellable=null;if(_each===INTERNAL){this._eachValues=Array(this._length);}else if(_each===0){this._eachValues=null;}else{this._eachValues=undefined;}
this._promise._captureStackTrace();this._init$(undefined,-5);}
util.inherits(ReductionPromiseArray,PromiseArray);ReductionPromiseArray.prototype._gotAccum=function(accum){if(this._eachValues!==undefined&&this._eachValues!==null&&accum!==INTERNAL){this._eachValues.push(accum);}};ReductionPromiseArray.prototype._eachComplete=function(value){if(this._eachValues!==null){this._eachValues.push(value);}
return this._eachValues;};ReductionPromiseArray.prototype._init=function(){};ReductionPromiseArray.prototype._resolveEmptyArray=function(){this._resolve(this._eachValues!==undefined?this._eachValues:this._initialValue);};ReductionPromiseArray.prototype.shouldCopyValues=function(){return false;};ReductionPromiseArray.prototype._resolve=function(value){this._promise._resolveCallback(value);this._values=null;};ReductionPromiseArray.prototype._resultCancelled=function(sender){if(sender===this._initialValue)return this._cancel();if(this._isResolved())return;this._resultCancelled$();if(this._currentCancellable instanceof Promise){this._currentCancellable.cancel();}
if(this._initialValue instanceof Promise){this._initialValue.cancel();}};ReductionPromiseArray.prototype._iterate=function(values){this._values=values;var value;var i;var length=values.length;if(this._initialValue!==undefined){value=this._initialValue;i=0;}else{value=Promise.resolve(values[0]);i=1;}
this._currentCancellable=value;if(!value.isRejected()){for(;i<length;++i){var ctx={accum:null,value:values[i],index:i,length:length,array:this};value=value._then(gotAccum,undefined,undefined,ctx,undefined);}}
if(this._eachValues!==undefined){value=value._then(this._eachComplete,undefined,undefined,this,undefined);}
value._then(completed,completed,undefined,value,this);};Promise.prototype.reduce=function(fn,initialValue){return reduce(this,fn,initialValue,null);};Promise.reduce=function(promises,fn,initialValue,_each){return reduce(promises,fn,initialValue,_each);};function completed(valueOrReason,array){if(this.isFulfilled()){array._resolve(valueOrReason);}else{array._reject(valueOrReason);}}
function reduce(promises,fn,initialValue,_each){if(typeof fn!=="function"){return apiRejection("expecting a function but got "+util.classString(fn));}
var array=new ReductionPromiseArray(promises,fn,initialValue,_each);return array.promise();}
function gotAccum(accum){this.accum=accum;this.array._gotAccum(accum);var value=tryConvertToPromise(this.value,this.array._promise);if(value instanceof Promise){this.array._currentCancellable=value;return value._then(gotValue,undefined,undefined,this,undefined);}else{return gotValue.call(this,value);}}
function gotValue(value){var array=this.array;var promise=array._promise;var fn=tryCatch(array._fn);promise._pushContext();var ret;if(array._eachValues!==undefined){ret=fn.call(promise._boundValue(),value,this.index,this.length);}else{ret=fn.call(promise._boundValue(),this.accum,value,this.index,this.length);}
if(ret instanceof Promise){array._currentCancellable=ret;}
var promiseCreated=promise._popContext();debug.checkForgottenReturns(ret,promiseCreated,array._eachValues!==undefined?"Promise.each":"Promise.reduce",promise);return ret;}};},{"./util":74}],67:[function(require,module,exports){(function(process,global){"use strict";var util=require("./util");var schedule;var noAsyncScheduler=function(){throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");};var NativePromise=util.getNativePromise();if(util.isNode&&typeof MutationObserver==="undefined"){var GlobalSetImmediate=global.setImmediate;var ProcessNextTick=process.nextTick;schedule=util.isRecentNode?function(fn){GlobalSetImmediate.call(global,fn);}:function(fn){ProcessNextTick.call(process,fn);};}else if(typeof NativePromise==="function"&&typeof NativePromise.resolve==="function"){var nativePromise=NativePromise.resolve();schedule=function(fn){nativePromise.then(fn);};}else if((typeof MutationObserver!=="undefined")&&!(typeof window!=="undefined"&&window.navigator&&(window.navigator.standalone||window.cordova))){schedule=(function(){var div=document.createElement("div");var opts={attributes:true};var toggleScheduled=false;var div2=document.createElement("div");var o2=new MutationObserver(function(){div.classList.toggle("foo");toggleScheduled=false;});o2.observe(div2,opts);var scheduleToggle=function(){if(toggleScheduled)return;toggleScheduled=true;div2.classList.toggle("foo");};return function schedule(fn){var o=new MutationObserver(function(){o.disconnect();fn();});o.observe(div,opts);scheduleToggle();};})();}else if(typeof setImmediate!=="undefined"){schedule=function(fn){setImmediate(fn);};}else if(typeof setTimeout!=="undefined"){schedule=function(fn){setTimeout(fn,0);};}else{schedule=noAsyncScheduler;}
module.exports=schedule;}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./util":74,"_process":138}],68:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,debug){var PromiseInspection=Promise.PromiseInspection;var util=require("./util");function SettledPromiseArray(values){this.constructor$(values);}
util.inherits(SettledPromiseArray,PromiseArray);SettledPromiseArray.prototype._promiseResolved=function(index,inspection){this._values[index]=inspection;var totalResolved=++this._totalResolved;if(totalResolved>=this._length){this._resolve(this._values);return true;}
return false;};SettledPromiseArray.prototype._promiseFulfilled=function(value,index){var ret=new PromiseInspection();ret._bitField=33554432;ret._settledValueField=value;return this._promiseResolved(index,ret);};SettledPromiseArray.prototype._promiseRejected=function(reason,index){var ret=new PromiseInspection();ret._bitField=16777216;ret._settledValueField=reason;return this._promiseResolved(index,ret);};Promise.settle=function(promises){debug.deprecated(".settle()",".reflect()");return new SettledPromiseArray(promises).promise();};Promise.prototype.settle=function(){return Promise.settle(this);};};},{"./util":74}],69:[function(require,module,exports){"use strict";module.exports=function(Promise,PromiseArray,apiRejection){var util=require("./util");var RangeError=require("./errors").RangeError;var AggregateError=require("./errors").AggregateError;var isArray=util.isArray;var CANCELLATION={};function SomePromiseArray(values){this.constructor$(values);this._howMany=0;this._unwrap=false;this._initialized=false;}
util.inherits(SomePromiseArray,PromiseArray);SomePromiseArray.prototype._init=function(){if(!this._initialized){return;}
if(this._howMany===0){this._resolve([]);return;}
this._init$(undefined,-5);var isArrayResolved=isArray(this._values);if(!this._isResolved()&&isArrayResolved&&this._howMany>this._canPossiblyFulfill()){this._reject(this._getRangeError(this.length()));}};SomePromiseArray.prototype.init=function(){this._initialized=true;this._init();};SomePromiseArray.prototype.setUnwrap=function(){this._unwrap=true;};SomePromiseArray.prototype.howMany=function(){return this._howMany;};SomePromiseArray.prototype.setHowMany=function(count){this._howMany=count;};SomePromiseArray.prototype._promiseFulfilled=function(value){this._addFulfilled(value);if(this._fulfilled()===this.howMany()){this._values.length=this.howMany();if(this.howMany()===1&&this._unwrap){this._resolve(this._values[0]);}else{this._resolve(this._values);}
return true;}
return false;};SomePromiseArray.prototype._promiseRejected=function(reason){this._addRejected(reason);return this._checkOutcome();};SomePromiseArray.prototype._promiseCancelled=function(){if(this._values instanceof Promise||this._values==null){return this._cancel();}
this._addRejected(CANCELLATION);return this._checkOutcome();};SomePromiseArray.prototype._checkOutcome=function(){if(this.howMany()>this._canPossiblyFulfill()){var e=new AggregateError();for(var i=this.length();i<this._values.length;++i){if(this._values[i]!==CANCELLATION){e.push(this._values[i]);}}
if(e.length>0){this._reject(e);}else{this._cancel();}
return true;}
return false;};SomePromiseArray.prototype._fulfilled=function(){return this._totalResolved;};SomePromiseArray.prototype._rejected=function(){return this._values.length-this.length();};SomePromiseArray.prototype._addRejected=function(reason){this._values.push(reason);};SomePromiseArray.prototype._addFulfilled=function(value){this._values[this._totalResolved++]=value;};SomePromiseArray.prototype._canPossiblyFulfill=function(){return this.length()-this._rejected();};SomePromiseArray.prototype._getRangeError=function(count){var message="Input array must contain at least "+
this._howMany+" items but contains only "+count+" items";return new RangeError(message);};SomePromiseArray.prototype._resolveEmptyArray=function(){this._reject(this._getRangeError(0));};function some(promises,howMany){if((howMany|0)!==howMany||howMany<0){return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
var ret=new SomePromiseArray(promises);var promise=ret.promise();ret.setHowMany(howMany);ret.init();return promise;}
Promise.some=function(promises,howMany){return some(promises,howMany);};Promise.prototype.some=function(howMany){return some(this,howMany);};Promise._SomePromiseArray=SomePromiseArray;};},{"./errors":50,"./util":74}],70:[function(require,module,exports){"use strict";module.exports=function(Promise){function PromiseInspection(promise){if(promise!==undefined){promise=promise._target();this._bitField=promise._bitField;this._settledValueField=promise._isFateSealed()?promise._settledValue():undefined;}
else{this._bitField=0;this._settledValueField=undefined;}}
PromiseInspection.prototype._settledValue=function(){return this._settledValueField;};var value=PromiseInspection.prototype.value=function(){if(!this.isFulfilled()){throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
return this._settledValue();};var reason=PromiseInspection.prototype.error=PromiseInspection.prototype.reason=function(){if(!this.isRejected()){throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");}
return this._settledValue();};var isFulfilled=PromiseInspection.prototype.isFulfilled=function(){return(this._bitField&33554432)!==0;};var isRejected=PromiseInspection.prototype.isRejected=function(){return(this._bitField&16777216)!==0;};var isPending=PromiseInspection.prototype.isPending=function(){return(this._bitField&50397184)===0;};var isResolved=PromiseInspection.prototype.isResolved=function(){return(this._bitField&50331648)!==0;};PromiseInspection.prototype.isCancelled=function(){return(this._bitField&8454144)!==0;};Promise.prototype.__isCancelled=function(){return(this._bitField&65536)===65536;};Promise.prototype._isCancelled=function(){return this._target().__isCancelled();};Promise.prototype.isCancelled=function(){return(this._target()._bitField&8454144)!==0;};Promise.prototype.isPending=function(){return isPending.call(this._target());};Promise.prototype.isRejected=function(){return isRejected.call(this._target());};Promise.prototype.isFulfilled=function(){return isFulfilled.call(this._target());};Promise.prototype.isResolved=function(){return isResolved.call(this._target());};Promise.prototype.value=function(){return value.call(this._target());};Promise.prototype.reason=function(){var target=this._target();target._unsetRejectionIsUnhandled();return reason.call(target);};Promise.prototype._value=function(){return this._settledValue();};Promise.prototype._reason=function(){this._unsetRejectionIsUnhandled();return this._settledValue();};Promise.PromiseInspection=PromiseInspection;};},{}],71:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL){var util=require("./util");var errorObj=util.errorObj;var isObject=util.isObject;function tryConvertToPromise(obj,context){if(isObject(obj)){if(obj instanceof Promise)return obj;var then=getThen(obj);if(then===errorObj){if(context)context._pushContext();var ret=Promise.reject(then.e);if(context)context._popContext();return ret;}else if(typeof then==="function"){if(isAnyBluebirdPromise(obj)){var ret=new Promise(INTERNAL);obj._then(ret._fulfill,ret._reject,undefined,ret,null);return ret;}
return doThenable(obj,then,context);}}
return obj;}
function doGetThen(obj){return obj.then;}
function getThen(obj){try{return doGetThen(obj);}catch(e){errorObj.e=e;return errorObj;}}
var hasProp={}.hasOwnProperty;function isAnyBluebirdPromise(obj){try{return hasProp.call(obj,"_promise0");}catch(e){return false;}}
function doThenable(x,then,context){var promise=new Promise(INTERNAL);var ret=promise;if(context)context._pushContext();promise._captureStackTrace();if(context)context._popContext();var synchronous=true;var result=util.tryCatch(then).call(x,resolve,reject);synchronous=false;if(promise&&result===errorObj){promise._rejectCallback(result.e,true,true);promise=null;}
function resolve(value){if(!promise)return;promise._resolveCallback(value);promise=null;}
function reject(reason){if(!promise)return;promise._rejectCallback(reason,synchronous,true);promise=null;}
return ret;}
return tryConvertToPromise;};},{"./util":74}],72:[function(require,module,exports){"use strict";module.exports=function(Promise,INTERNAL,debug){var util=require("./util");var TimeoutError=Promise.TimeoutError;function HandleWrapper(handle){this.handle=handle;}
HandleWrapper.prototype._resultCancelled=function(){clearTimeout(this.handle);};var afterValue=function(value){return delay(+this).thenReturn(value);};var delay=Promise.delay=function(ms,value){var ret;var handle;if(value!==undefined){ret=Promise.resolve(value)._then(afterValue,null,null,ms,undefined);if(debug.cancellation()&&value instanceof Promise){ret._setOnCancel(value);}}else{ret=new Promise(INTERNAL);handle=setTimeout(function(){ret._fulfill();},+ms);if(debug.cancellation()){ret._setOnCancel(new HandleWrapper(handle));}
ret._captureStackTrace();}
ret._setAsyncGuaranteed();return ret;};Promise.prototype.delay=function(ms){return delay(ms,this);};var afterTimeout=function(promise,message,parent){var err;if(typeof message!=="string"){if(message instanceof Error){err=message;}else{err=new TimeoutError("operation timed out");}}else{err=new TimeoutError(message);}
util.markAsOriginatingFromRejection(err);promise._attachExtraTrace(err);promise._reject(err);if(parent!=null){parent.cancel();}};function successClear(value){clearTimeout(this.handle);return value;}
function failureClear(reason){clearTimeout(this.handle);throw reason;}
Promise.prototype.timeout=function(ms,message){ms=+ms;var ret,parent;var handleWrapper=new HandleWrapper(setTimeout(function timeoutTimeout(){if(ret.isPending()){afterTimeout(ret,message,parent);}},ms));if(debug.cancellation()){parent=this.then();ret=parent._then(successClear,failureClear,undefined,handleWrapper,undefined);ret._setOnCancel(handleWrapper);}else{ret=this._then(successClear,failureClear,undefined,handleWrapper,undefined);}
return ret;};};},{"./util":74}],73:[function(require,module,exports){"use strict";module.exports=function(Promise,apiRejection,tryConvertToPromise,createContext,INTERNAL,debug){var util=require("./util");var TypeError=require("./errors").TypeError;var inherits=require("./util").inherits;var errorObj=util.errorObj;var tryCatch=util.tryCatch;var NULL={};function thrower(e){setTimeout(function(){throw e;},0);}
function castPreservingDisposable(thenable){var maybePromise=tryConvertToPromise(thenable);if(maybePromise!==thenable&&typeof thenable._isDisposable==="function"&&typeof thenable._getDisposer==="function"&&thenable._isDisposable()){maybePromise._setDisposable(thenable._getDisposer());}
return maybePromise;}
function dispose(resources,inspection){var i=0;var len=resources.length;var ret=new Promise(INTERNAL);function iterator(){if(i>=len)return ret._fulfill();var maybePromise=castPreservingDisposable(resources[i++]);if(maybePromise instanceof Promise&&maybePromise._isDisposable()){try{maybePromise=tryConvertToPromise(maybePromise._getDisposer().tryDispose(inspection),resources.promise);}catch(e){return thrower(e);}
if(maybePromise instanceof Promise){return maybePromise._then(iterator,thrower,null,null,null);}}
iterator();}
iterator();return ret;}
function Disposer(data,promise,context){this._data=data;this._promise=promise;this._context=context;}
Disposer.prototype.data=function(){return this._data;};Disposer.prototype.promise=function(){return this._promise;};Disposer.prototype.resource=function(){if(this.promise().isFulfilled()){return this.promise().value();}
return NULL;};Disposer.prototype.tryDispose=function(inspection){var resource=this.resource();var context=this._context;if(context!==undefined)context._pushContext();var ret=resource!==NULL?this.doDispose(resource,inspection):null;if(context!==undefined)context._popContext();this._promise._unsetDisposable();this._data=null;return ret;};Disposer.isDisposer=function(d){return(d!=null&&typeof d.resource==="function"&&typeof d.tryDispose==="function");};function FunctionDisposer(fn,promise,context){this.constructor$(fn,promise,context);}
inherits(FunctionDisposer,Disposer);FunctionDisposer.prototype.doDispose=function(resource,inspection){var fn=this.data();return fn.call(resource,resource,inspection);};function maybeUnwrapDisposer(value){if(Disposer.isDisposer(value)){this.resources[this.index]._setDisposable(value);return value.promise();}
return value;}
function ResourceList(length){this.length=length;this.promise=null;this[length-1]=null;}
ResourceList.prototype._resultCancelled=function(){var len=this.length;for(var i=0;i<len;++i){var item=this[i];if(item instanceof Promise){item.cancel();}}};Promise.using=function(){var len=arguments.length;if(len<2)return apiRejection("you must pass at least 2 arguments to Promise.using");var fn=arguments[len-1];if(typeof fn!=="function"){return apiRejection("expecting a function but got "+util.classString(fn));}
var input;var spreadArgs=true;if(len===2&&Array.isArray(arguments[0])){input=arguments[0];len=input.length;spreadArgs=false;}else{input=arguments;len--;}
var resources=new ResourceList(len);for(var i=0;i<len;++i){var resource=input[i];if(Disposer.isDisposer(resource)){var disposer=resource;resource=resource.promise();resource._setDisposable(disposer);}else{var maybePromise=tryConvertToPromise(resource);if(maybePromise instanceof Promise){resource=maybePromise._then(maybeUnwrapDisposer,null,null,{resources:resources,index:i},undefined);}}
resources[i]=resource;}
var reflectedResources=new Array(resources.length);for(var i=0;i<reflectedResources.length;++i){reflectedResources[i]=Promise.resolve(resources[i]).reflect();}
var resultPromise=Promise.all(reflectedResources).then(function(inspections){for(var i=0;i<inspections.length;++i){var inspection=inspections[i];if(inspection.isRejected()){errorObj.e=inspection.error();return errorObj;}else if(!inspection.isFulfilled()){resultPromise.cancel();return;}
inspections[i]=inspection.value();}
promise._pushContext();fn=tryCatch(fn);var ret=spreadArgs?fn.apply(undefined,inspections):fn(inspections);var promiseCreated=promise._popContext();debug.checkForgottenReturns(ret,promiseCreated,"Promise.using",promise);return ret;});var promise=resultPromise.lastly(function(){var inspection=new Promise.PromiseInspection(resultPromise);return dispose(resources,inspection);});resources.promise=promise;promise._setOnCancel(resources);return promise;};Promise.prototype._setDisposable=function(disposer){this._bitField=this._bitField|131072;this._disposer=disposer;};Promise.prototype._isDisposable=function(){return(this._bitField&131072)>0;};Promise.prototype._getDisposer=function(){return this._disposer;};Promise.prototype._unsetDisposable=function(){this._bitField=this._bitField&(~131072);this._disposer=undefined;};Promise.prototype.disposer=function(fn){if(typeof fn==="function"){return new FunctionDisposer(fn,this,createContext());}
throw new TypeError();};};},{"./errors":50,"./util":74}],74:[function(require,module,exports){(function(process,global){"use strict";var es5=require("./es5");var canEvaluate=typeof navigator=="undefined";var errorObj={e:{}};var tryCatchTarget;var globalObject=typeof self!=="undefined"?self:typeof window!=="undefined"?window:typeof global!=="undefined"?global:this!==undefined?this:null;function tryCatcher(){try{var target=tryCatchTarget;tryCatchTarget=null;return target.apply(this,arguments);}catch(e){errorObj.e=e;return errorObj;}}
function tryCatch(fn){tryCatchTarget=fn;return tryCatcher;}
var inherits=function(Child,Parent){var hasProp={}.hasOwnProperty;function T(){this.constructor=Child;this.constructor$=Parent;for(var propertyName in Parent.prototype){if(hasProp.call(Parent.prototype,propertyName)&&propertyName.charAt(propertyName.length-1)!=="$"){this[propertyName+"$"]=Parent.prototype[propertyName];}}}
T.prototype=Parent.prototype;Child.prototype=new T();return Child.prototype;};function isPrimitive(val){return val==null||val===true||val===false||typeof val==="string"||typeof val==="number";}
function isObject(value){return typeof value==="function"||typeof value==="object"&&value!==null;}
function maybeWrapAsError(maybeError){if(!isPrimitive(maybeError))return maybeError;return new Error(safeToString(maybeError));}
function withAppended(target,appendee){var len=target.length;var ret=new Array(len+1);var i;for(i=0;i<len;++i){ret[i]=target[i];}
ret[i]=appendee;return ret;}
function getDataPropertyOrDefault(obj,key,defaultValue){if(es5.isES5){var desc=Object.getOwnPropertyDescriptor(obj,key);if(desc!=null){return desc.get==null&&desc.set==null?desc.value:defaultValue;}}else{return{}.hasOwnProperty.call(obj,key)?obj[key]:undefined;}}
function notEnumerableProp(obj,name,value){if(isPrimitive(obj))return obj;var descriptor={value:value,configurable:true,enumerable:false,writable:true};es5.defineProperty(obj,name,descriptor);return obj;}
function thrower(r){throw r;}
var inheritedDataKeys=(function(){var excludedPrototypes=[Array.prototype,Object.prototype,Function.prototype];var isExcludedProto=function(val){for(var i=0;i<excludedPrototypes.length;++i){if(excludedPrototypes[i]===val){return true;}}
return false;};if(es5.isES5){var getKeys=Object.getOwnPropertyNames;return function(obj){var ret=[];var visitedKeys=Object.create(null);while(obj!=null&&!isExcludedProto(obj)){var keys;try{keys=getKeys(obj);}catch(e){return ret;}
for(var i=0;i<keys.length;++i){var key=keys[i];if(visitedKeys[key])continue;visitedKeys[key]=true;var desc=Object.getOwnPropertyDescriptor(obj,key);if(desc!=null&&desc.get==null&&desc.set==null){ret.push(key);}}
obj=es5.getPrototypeOf(obj);}
return ret;};}else{var hasProp={}.hasOwnProperty;return function(obj){if(isExcludedProto(obj))return[];var ret=[];enumeration:for(var key in obj){if(hasProp.call(obj,key)){ret.push(key);}else{for(var i=0;i<excludedPrototypes.length;++i){if(hasProp.call(excludedPrototypes[i],key)){continue enumeration;}}
ret.push(key);}}
return ret;};}})();var thisAssignmentPattern=/this\s*\.\s*\S+\s*=/;function isClass(fn){try{if(typeof fn==="function"){var keys=es5.names(fn.prototype);var hasMethods=es5.isES5&&keys.length>1;var hasMethodsOtherThanConstructor=keys.length>0&&!(keys.length===1&&keys[0]==="constructor");var hasThisAssignmentAndStaticMethods=thisAssignmentPattern.test(fn+"")&&es5.names(fn).length>0;if(hasMethods||hasMethodsOtherThanConstructor||hasThisAssignmentAndStaticMethods){return true;}}
return false;}catch(e){return false;}}
function toFastProperties(obj){function FakeConstructor(){}
FakeConstructor.prototype=obj;var l=8;while(l--)new FakeConstructor();return obj;eval(obj);}
var rident=/^[a-z$_][a-z$_0-9]*$/i;function isIdentifier(str){return rident.test(str);}
function filledRange(count,prefix,suffix){var ret=new Array(count);for(var i=0;i<count;++i){ret[i]=prefix+i+suffix;}
return ret;}
function safeToString(obj){try{return obj+"";}catch(e){return "[no string representation]";}}
function isError(obj){return obj!==null&&typeof obj==="object"&&typeof obj.message==="string"&&typeof obj.name==="string";}
function markAsOriginatingFromRejection(e){try{notEnumerableProp(e,"isOperational",true);}
catch(ignore){}}
function originatesFromRejection(e){if(e==null)return false;return((e instanceof Error["__BluebirdErrorTypes__"].OperationalError)||e["isOperational"]===true);}
function canAttachTrace(obj){return isError(obj)&&es5.propertyIsWritable(obj,"stack");}
var ensureErrorObject=(function(){if(!("stack"in new Error())){return function(value){if(canAttachTrace(value))return value;try{throw new Error(safeToString(value));}
catch(err){return err;}};}else{return function(value){if(canAttachTrace(value))return value;return new Error(safeToString(value));};}})();function classString(obj){return{}.toString.call(obj);}
function copyDescriptors(from,to,filter){var keys=es5.names(from);for(var i=0;i<keys.length;++i){var key=keys[i];if(filter(key)){try{es5.defineProperty(to,key,es5.getDescriptor(from,key));}catch(ignore){}}}}
var asArray=function(v){if(es5.isArray(v)){return v;}
return null;};if(typeof Symbol!=="undefined"&&Symbol.iterator){var ArrayFrom=typeof Array.from==="function"?function(v){return Array.from(v);}:function(v){var ret=[];var it=v[Symbol.iterator]();var itResult;while(!((itResult=it.next()).done)){ret.push(itResult.value);}
return ret;};asArray=function(v){if(es5.isArray(v)){return v;}else if(v!=null&&typeof v[Symbol.iterator]==="function"){return ArrayFrom(v);}
return null;};}
var isNode=typeof process!=="undefined"&&classString(process).toLowerCase()==="[object process]";var hasEnvVariables=typeof process!=="undefined"&&typeof process.env!=="undefined";function env(key){return hasEnvVariables?process.env[key]:undefined;}
function getNativePromise(){if(typeof Promise==="function"){try{var promise=new Promise(function(){});if({}.toString.call(promise)==="[object Promise]"){return Promise;}}catch(e){}}}
function domainBind(self,cb){return self.bind(cb);}
var ret={isClass:isClass,isIdentifier:isIdentifier,inheritedDataKeys:inheritedDataKeys,getDataPropertyOrDefault:getDataPropertyOrDefault,thrower:thrower,isArray:es5.isArray,asArray:asArray,notEnumerableProp:notEnumerableProp,isPrimitive:isPrimitive,isObject:isObject,isError:isError,canEvaluate:canEvaluate,errorObj:errorObj,tryCatch:tryCatch,inherits:inherits,withAppended:withAppended,maybeWrapAsError:maybeWrapAsError,toFastProperties:toFastProperties,filledRange:filledRange,toString:safeToString,canAttachTrace:canAttachTrace,ensureErrorObject:ensureErrorObject,originatesFromRejection:originatesFromRejection,markAsOriginatingFromRejection:markAsOriginatingFromRejection,classString:classString,copyDescriptors:copyDescriptors,hasDevTools:typeof chrome!=="undefined"&&chrome&&typeof chrome.loadTimes==="function",isNode:isNode,hasEnvVariables:hasEnvVariables,env:env,global:globalObject,getNativePromise:getNativePromise,domainBind:domainBind};ret.isRecentNode=ret.isNode&&(function(){var version=process.versions.node.split(".").map(Number);return(version[0]===0&&version[1]>10)||(version[0]>0);})();if(ret.isNode)ret.toFastProperties(process);try{throw new Error();}catch(e){ret.lastLineError=e;}
module.exports=ret;}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./es5":51,"_process":138}],75:[function(require,module,exports){},{}],76:[function(require,module,exports){(function(global){'use strict';var buffer=require('buffer');var Buffer=buffer.Buffer;var SlowBuffer=buffer.SlowBuffer;var MAX_LEN=buffer.kMaxLength||2147483647;exports.alloc=function alloc(size,fill,encoding){if(typeof Buffer.alloc==='function'){return Buffer.alloc(size,fill,encoding);}
if(typeof encoding==='number'){throw new TypeError('encoding must not be number');}
if(typeof size!=='number'){throw new TypeError('size must be a number');}
if(size>MAX_LEN){throw new RangeError('size is too large');}
var enc=encoding;var _fill=fill;if(_fill===undefined){enc=undefined;_fill=0;}
var buf=new Buffer(size);if(typeof _fill==='string'){var fillBuf=new Buffer(_fill,enc);var flen=fillBuf.length;var i=-1;while(++i<size){buf[i]=fillBuf[i%flen];}}else{buf.fill(_fill);}
return buf;}
exports.allocUnsafe=function allocUnsafe(size){if(typeof Buffer.allocUnsafe==='function'){return Buffer.allocUnsafe(size);}
if(typeof size!=='number'){throw new TypeError('size must be a number');}
if(size>MAX_LEN){throw new RangeError('size is too large');}
return new Buffer(size);}
exports.from=function from(value,encodingOrOffset,length){if(typeof Buffer.from==='function'&&(!global.Uint8Array||Uint8Array.from!==Buffer.from)){return Buffer.from(value,encodingOrOffset,length);}
if(typeof value==='number'){throw new TypeError('"value" argument must not be a number');}
if(typeof value==='string'){return new Buffer(value,encodingOrOffset);}
if(typeof ArrayBuffer!=='undefined'&&value instanceof ArrayBuffer){var offset=encodingOrOffset;if(arguments.length===1){return new Buffer(value);}
if(typeof offset==='undefined'){offset=0;}
var len=length;if(typeof len==='undefined'){len=value.byteLength-offset;}
if(offset>=value.byteLength){throw new RangeError('\'offset\' is out of bounds');}
if(len>value.byteLength-offset){throw new RangeError('\'length\' is out of bounds');}
return new Buffer(value.slice(offset,offset+len));}
if(Buffer.isBuffer(value)){var out=new Buffer(value.length);value.copy(out,0,0,value.length);return out;}
if(value){if(Array.isArray(value)||(typeof ArrayBuffer!=='undefined'&&value.buffer instanceof ArrayBuffer)||'length'in value){return new Buffer(value);}
if(value.type==='Buffer'&&Array.isArray(value.data)){return new Buffer(value.data);}}
throw new TypeError('First argument must be a string, Buffer, '+'ArrayBuffer, Array, or array-like object.');}
exports.allocUnsafeSlow=function allocUnsafeSlow(size){if(typeof Buffer.allocUnsafeSlow==='function'){return Buffer.allocUnsafeSlow(size);}
if(typeof size!=='number'){throw new TypeError('size must be a number');}
if(size>=MAX_LEN){throw new RangeError('size is too large');}
return new SlowBuffer(size);}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"buffer":77}],77:[function(require,module,exports){(function(global){/*!
* The buffer module from node.js, for the browser.
*
* @author Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
* @license MIT
*/'use strict'
var base64=require('base64-js')
var ieee754=require('ieee754')
var isArray=require('isarray')
exports.Buffer=Buffer
exports.SlowBuffer=SlowBuffer
exports.INSPECT_MAX_BYTES=50
Buffer.TYPED_ARRAY_SUPPORT=global.TYPED_ARRAY_SUPPORT!==undefined?global.TYPED_ARRAY_SUPPORT:typedArraySupport()
exports.kMaxLength=kMaxLength()
function typedArraySupport(){try{var arr=new Uint8Array(1)
arr.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}}
return arr.foo()===42&&typeof arr.subarray==='function'&&arr.subarray(1,1).byteLength===0}catch(e){return false}}
function kMaxLength(){return Buffer.TYPED_ARRAY_SUPPORT?0x7fffffff:0x3fffffff}
function createBuffer(that,length){if(kMaxLength()<length){throw new RangeError('Invalid typed array length')}
if(Buffer.TYPED_ARRAY_SUPPORT){that=new Uint8Array(length)
that.__proto__=Buffer.prototype}else{if(that===null){that=new Buffer(length)}
that.length=length}
return that}
function Buffer(arg,encodingOrOffset,length){if(!Buffer.TYPED_ARRAY_SUPPORT&&!(this instanceof Buffer)){return new Buffer(arg,encodingOrOffset,length)}
if(typeof arg==='number'){if(typeof encodingOrOffset==='string'){throw new Error('If encoding is specified then the first argument must be a string')}
return allocUnsafe(this,arg)}
return from(this,arg,encodingOrOffset,length)}
Buffer.poolSize=8192
Buffer._augment=function(arr){arr.__proto__=Buffer.prototype
return arr}
function from(that,value,encodingOrOffset,length){if(typeof value==='number'){throw new TypeError('"value" argument must not be a number')}
if(typeof ArrayBuffer!=='undefined'&&value instanceof ArrayBuffer){return fromArrayBuffer(that,value,encodingOrOffset,length)}
if(typeof value==='string'){return fromString(that,value,encodingOrOffset)}
return fromObject(that,value)}
Buffer.from=function(value,encodingOrOffset,length){return from(null,value,encodingOrOffset,length)}
if(Buffer.TYPED_ARRAY_SUPPORT){Buffer.prototype.__proto__=Uint8Array.prototype
Buffer.__proto__=Uint8Array
if(typeof Symbol!=='undefined'&&Symbol.species&&Buffer[Symbol.species]===Buffer){Object.defineProperty(Buffer,Symbol.species,{value:null,configurable:true})}}
function assertSize(size){if(typeof size!=='number'){throw new TypeError('"size" argument must be a number')}else if(size<0){throw new RangeError('"size" argument must not be negative')}}
function alloc(that,size,fill,encoding){assertSize(size)
if(size<=0){return createBuffer(that,size)}
if(fill!==undefined){return typeof encoding==='string'?createBuffer(that,size).fill(fill,encoding):createBuffer(that,size).fill(fill)}
return createBuffer(that,size)}
Buffer.alloc=function(size,fill,encoding){return alloc(null,size,fill,encoding)}
function allocUnsafe(that,size){assertSize(size)
that=createBuffer(that,size<0?0:checked(size)|0)
if(!Buffer.TYPED_ARRAY_SUPPORT){for(var i=0;i<size;++i){that[i]=0}}
return that}
Buffer.allocUnsafe=function(size){return allocUnsafe(null,size)}
Buffer.allocUnsafeSlow=function(size){return allocUnsafe(null,size)}
function fromString(that,string,encoding){if(typeof encoding!=='string'||encoding===''){encoding='utf8'}
if(!Buffer.isEncoding(encoding)){throw new TypeError('"encoding" must be a valid string encoding')}
var length=byteLength(string,encoding)|0
that=createBuffer(that,length)
var actual=that.write(string,encoding)
if(actual!==length){that=that.slice(0,actual)}
return that}
function fromArrayLike(that,array){var length=array.length<0?0:checked(array.length)|0
that=createBuffer(that,length)
for(var i=0;i<length;i+=1){that[i]=array[i]&255}
return that}
function fromArrayBuffer(that,array,byteOffset,length){array.byteLength
if(byteOffset<0||array.byteLength<byteOffset){throw new RangeError('\'offset\' is out of bounds')}
if(array.byteLength<byteOffset+(length||0)){throw new RangeError('\'length\' is out of bounds')}
if(byteOffset===undefined&&length===undefined){array=new Uint8Array(array)}else if(length===undefined){array=new Uint8Array(array,byteOffset)}else{array=new Uint8Array(array,byteOffset,length)}
if(Buffer.TYPED_ARRAY_SUPPORT){that=array
that.__proto__=Buffer.prototype}else{that=fromArrayLike(that,array)}
return that}
function fromObject(that,obj){if(Buffer.isBuffer(obj)){var len=checked(obj.length)|0
that=createBuffer(that,len)
if(that.length===0){return that}
obj.copy(that,0,0,len)
return that}
if(obj){if((typeof ArrayBuffer!=='undefined'&&obj.buffer instanceof ArrayBuffer)||'length'in obj){if(typeof obj.length!=='number'||isnan(obj.length)){return createBuffer(that,0)}
return fromArrayLike(that,obj)}
if(obj.type==='Buffer'&&isArray(obj.data)){return fromArrayLike(that,obj.data)}}
throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')}
function checked(length){if(length>=kMaxLength()){throw new RangeError('Attempt to allocate Buffer larger than maximum '+
'size: 0x'+kMaxLength().toString(16)+' bytes')}
return length|0}
function SlowBuffer(length){if(+length!=length){length=0}
return Buffer.alloc(+length)}
Buffer.isBuffer=function isBuffer(b){return!!(b!=null&&b._isBuffer)}
Buffer.compare=function compare(a,b){if(!Buffer.isBuffer(a)||!Buffer.isBuffer(b)){throw new TypeError('Arguments must be Buffers')}
if(a===b)return 0
var x=a.length
var y=b.length
for(var i=0,len=Math.min(x,y);i<len;++i){if(a[i]!==b[i]){x=a[i]
y=b[i]
break}}
if(x<y)return-1
if(y<x)return 1
return 0}
Buffer.isEncoding=function isEncoding(encoding){switch(String(encoding).toLowerCase()){case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'latin1':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return true
default:return false}}
Buffer.concat=function concat(list,length){if(!isArray(list)){throw new TypeError('"list" argument must be an Array of Buffers')}
if(list.length===0){return Buffer.alloc(0)}
var i
if(length===undefined){length=0
for(i=0;i<list.length;++i){length+=list[i].length}}
var buffer=Buffer.allocUnsafe(length)
var pos=0
for(i=0;i<list.length;++i){var buf=list[i]
if(!Buffer.isBuffer(buf)){throw new TypeError('"list" argument must be an Array of Buffers')}
buf.copy(buffer,pos)
pos+=buf.length}
return buffer}
function byteLength(string,encoding){if(Buffer.isBuffer(string)){return string.length}
if(typeof ArrayBuffer!=='undefined'&&typeof ArrayBuffer.isView==='function'&&(ArrayBuffer.isView(string)||string instanceof ArrayBuffer)){return string.byteLength}
if(typeof string!=='string'){string=''+string}
var len=string.length
if(len===0)return 0
var loweredCase=false
for(;;){switch(encoding){case 'ascii':case 'latin1':case 'binary':return len
case 'utf8':case 'utf-8':case undefined:return utf8ToBytes(string).length
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return len*2
case 'hex':return len>>>1
case 'base64':return base64ToBytes(string).length
default:if(loweredCase)return utf8ToBytes(string).length
encoding=(''+encoding).toLowerCase()
loweredCase=true}}}
Buffer.byteLength=byteLength
function slowToString(encoding,start,end){var loweredCase=false
if(start===undefined||start<0){start=0}
if(start>this.length){return ''}
if(end===undefined||end>this.length){end=this.length}
if(end<=0){return ''}
end>>>=0
start>>>=0
if(end<=start){return ''}
if(!encoding)encoding='utf8'
while(true){switch(encoding){case 'hex':return hexSlice(this,start,end)
case 'utf8':case 'utf-8':return utf8Slice(this,start,end)
case 'ascii':return asciiSlice(this,start,end)
case 'latin1':case 'binary':return latin1Slice(this,start,end)
case 'base64':return base64Slice(this,start,end)
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return utf16leSlice(this,start,end)
default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding)
encoding=(encoding+'').toLowerCase()
loweredCase=true}}}
Buffer.prototype._isBuffer=true
function swap(b,n,m){var i=b[n]
b[n]=b[m]
b[m]=i}
Buffer.prototype.swap16=function swap16(){var len=this.length
if(len%2!==0){throw new RangeError('Buffer size must be a multiple of 16-bits')}
for(var i=0;i<len;i+=2){swap(this,i,i+1)}
return this}
Buffer.prototype.swap32=function swap32(){var len=this.length
if(len%4!==0){throw new RangeError('Buffer size must be a multiple of 32-bits')}
for(var i=0;i<len;i+=4){swap(this,i,i+3)
swap(this,i+1,i+2)}
return this}
Buffer.prototype.swap64=function swap64(){var len=this.length
if(len%8!==0){throw new RangeError('Buffer size must be a multiple of 64-bits')}
for(var i=0;i<len;i+=8){swap(this,i,i+7)
swap(this,i+1,i+6)
swap(this,i+2,i+5)
swap(this,i+3,i+4)}
return this}
Buffer.prototype.toString=function toString(){var length=this.length|0
if(length===0)return ''
if(arguments.length===0)return utf8Slice(this,0,length)
return slowToString.apply(this,arguments)}
Buffer.prototype.equals=function equals(b){if(!Buffer.isBuffer(b))throw new TypeError('Argument must be a Buffer')
if(this===b)return true
return Buffer.compare(this,b)===0}
Buffer.prototype.inspect=function inspect(){var str=''
var max=exports.INSPECT_MAX_BYTES
if(this.length>0){str=this.toString('hex',0,max).match(/.{2}/g).join(' ')
if(this.length>max)str+=' ... '}
return '<Buffer '+str+'>'}
Buffer.prototype.compare=function compare(target,start,end,thisStart,thisEnd){if(!Buffer.isBuffer(target)){throw new TypeError('Argument must be a Buffer')}
if(start===undefined){start=0}
if(end===undefined){end=target?target.length:0}
if(thisStart===undefined){thisStart=0}
if(thisEnd===undefined){thisEnd=this.length}
if(start<0||end>target.length||thisStart<0||thisEnd>this.length){throw new RangeError('out of range index')}
if(thisStart>=thisEnd&&start>=end){return 0}
if(thisStart>=thisEnd){return-1}
if(start>=end){return 1}
start>>>=0
end>>>=0
thisStart>>>=0
thisEnd>>>=0
if(this===target)return 0
var x=thisEnd-thisStart
var y=end-start
var len=Math.min(x,y)
var thisCopy=this.slice(thisStart,thisEnd)
var targetCopy=target.slice(start,end)
for(var i=0;i<len;++i){if(thisCopy[i]!==targetCopy[i]){x=thisCopy[i]
y=targetCopy[i]
break}}
if(x<y)return-1
if(y<x)return 1
return 0}
function bidirectionalIndexOf(buffer,val,byteOffset,encoding,dir){if(buffer.length===0)return-1
if(typeof byteOffset==='string'){encoding=byteOffset
byteOffset=0}else if(byteOffset>0x7fffffff){byteOffset=0x7fffffff}else if(byteOffset<-0x80000000){byteOffset=-0x80000000}
byteOffset=+byteOffset
if(isNaN(byteOffset)){byteOffset=dir?0:(buffer.length-1)}
if(byteOffset<0)byteOffset=buffer.length+byteOffset
if(byteOffset>=buffer.length){if(dir)return-1
else byteOffset=buffer.length-1}else if(byteOffset<0){if(dir)byteOffset=0
else return-1}
if(typeof val==='string'){val=Buffer.from(val,encoding)}
if(Buffer.isBuffer(val)){if(val.length===0){return-1}
return arrayIndexOf(buffer,val,byteOffset,encoding,dir)}else if(typeof val==='number'){val=val&0xFF
if(Buffer.TYPED_ARRAY_SUPPORT&&typeof Uint8Array.prototype.indexOf==='function'){if(dir){return Uint8Array.prototype.indexOf.call(buffer,val,byteOffset)}else{return Uint8Array.prototype.lastIndexOf.call(buffer,val,byteOffset)}}
return arrayIndexOf(buffer,[val],byteOffset,encoding,dir)}
throw new TypeError('val must be string, number or Buffer')}
function arrayIndexOf(arr,val,byteOffset,encoding,dir){var indexSize=1
var arrLength=arr.length
var valLength=val.length
if(encoding!==undefined){encoding=String(encoding).toLowerCase()
if(encoding==='ucs2'||encoding==='ucs-2'||encoding==='utf16le'||encoding==='utf-16le'){if(arr.length<2||val.length<2){return-1}
indexSize=2
arrLength/=2
valLength/=2
byteOffset/=2}}
function read(buf,i){if(indexSize===1){return buf[i]}else{return buf.readUInt16BE(i*indexSize)}}
var i
if(dir){var foundIndex=-1
for(i=byteOffset;i<arrLength;i++){if(read(arr,i)===read(val,foundIndex===-1?0:i-foundIndex)){if(foundIndex===-1)foundIndex=i
if(i-foundIndex+1===valLength)return foundIndex*indexSize}else{if(foundIndex!==-1)i-=i-foundIndex
foundIndex=-1}}}else{if(byteOffset+valLength>arrLength)byteOffset=arrLength-valLength
for(i=byteOffset;i>=0;i--){var found=true
for(var j=0;j<valLength;j++){if(read(arr,i+j)!==read(val,j)){found=false
break}}
if(found)return i}}
return-1}
Buffer.prototype.includes=function includes(val,byteOffset,encoding){return this.indexOf(val,byteOffset,encoding)!==-1}
Buffer.prototype.indexOf=function indexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,true)}
Buffer.prototype.lastIndexOf=function lastIndexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,false)}
function hexWrite(buf,string,offset,length){offset=Number(offset)||0
var remaining=buf.length-offset
if(!length){length=remaining}else{length=Number(length)
if(length>remaining){length=remaining}}
var strLen=string.length
if(strLen%2!==0)throw new TypeError('Invalid hex string')
if(length>strLen/2){length=strLen/2}
for(var i=0;i<length;++i){var parsed=parseInt(string.substr(i*2,2),16)
if(isNaN(parsed))return i
buf[offset+i]=parsed}
return i}
function utf8Write(buf,string,offset,length){return blitBuffer(utf8ToBytes(string,buf.length-offset),buf,offset,length)}
function asciiWrite(buf,string,offset,length){return blitBuffer(asciiToBytes(string),buf,offset,length)}
function latin1Write(buf,string,offset,length){return asciiWrite(buf,string,offset,length)}
function base64Write(buf,string,offset,length){return blitBuffer(base64ToBytes(string),buf,offset,length)}
function ucs2Write(buf,string,offset,length){return blitBuffer(utf16leToBytes(string,buf.length-offset),buf,offset,length)}
Buffer.prototype.write=function write(string,offset,length,encoding){if(offset===undefined){encoding='utf8'
length=this.length
offset=0}else if(length===undefined&&typeof offset==='string'){encoding=offset
length=this.length
offset=0}else if(isFinite(offset)){offset=offset|0
if(isFinite(length)){length=length|0
if(encoding===undefined)encoding='utf8'}else{encoding=length
length=undefined}}else{throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported')}
var remaining=this.length-offset
if(length===undefined||length>remaining)length=remaining
if((string.length>0&&(length<0||offset<0))||offset>this.length){throw new RangeError('Attempt to write outside buffer bounds')}
if(!encoding)encoding='utf8'
var loweredCase=false
for(;;){switch(encoding){case 'hex':return hexWrite(this,string,offset,length)
case 'utf8':case 'utf-8':return utf8Write(this,string,offset,length)
case 'ascii':return asciiWrite(this,string,offset,length)
case 'latin1':case 'binary':return latin1Write(this,string,offset,length)
case 'base64':return base64Write(this,string,offset,length)
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return ucs2Write(this,string,offset,length)
default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding)
encoding=(''+encoding).toLowerCase()
loweredCase=true}}}
Buffer.prototype.toJSON=function toJSON(){return{type:'Buffer',data:Array.prototype.slice.call(this._arr||this,0)}}
function base64Slice(buf,start,end){if(start===0&&end===buf.length){return base64.fromByteArray(buf)}else{return base64.fromByteArray(buf.slice(start,end))}}
function utf8Slice(buf,start,end){end=Math.min(buf.length,end)
var res=[]
var i=start
while(i<end){var firstByte=buf[i]
var codePoint=null
var bytesPerSequence=(firstByte>0xEF)?4:(firstByte>0xDF)?3:(firstByte>0xBF)?2:1
if(i+bytesPerSequence<=end){var secondByte,thirdByte,fourthByte,tempCodePoint
switch(bytesPerSequence){case 1:if(firstByte<0x80){codePoint=firstByte}
break
case 2:secondByte=buf[i+1]
if((secondByte&0xC0)===0x80){tempCodePoint=(firstByte&0x1F)<<0x6|(secondByte&0x3F)
if(tempCodePoint>0x7F){codePoint=tempCodePoint}}
break
case 3:secondByte=buf[i+1]
thirdByte=buf[i+2]
if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0xC|(secondByte&0x3F)<<0x6|(thirdByte&0x3F)
if(tempCodePoint>0x7FF&&(tempCodePoint<0xD800||tempCodePoint>0xDFFF)){codePoint=tempCodePoint}}
break
case 4:secondByte=buf[i+1]
thirdByte=buf[i+2]
fourthByte=buf[i+3]
if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80&&(fourthByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0x12|(secondByte&0x3F)<<0xC|(thirdByte&0x3F)<<0x6|(fourthByte&0x3F)
if(tempCodePoint>0xFFFF&&tempCodePoint<0x110000){codePoint=tempCodePoint}}}}
if(codePoint===null){codePoint=0xFFFD
bytesPerSequence=1}else if(codePoint>0xFFFF){codePoint-=0x10000
res.push(codePoint>>>10&0x3FF|0xD800)
codePoint=0xDC00|codePoint&0x3FF}
res.push(codePoint)
i+=bytesPerSequence}
return decodeCodePointsArray(res)}
var MAX_ARGUMENTS_LENGTH=0x1000
function decodeCodePointsArray(codePoints){var len=codePoints.length
if(len<=MAX_ARGUMENTS_LENGTH){return String.fromCharCode.apply(String,codePoints)}
var res=''
var i=0
while(i<len){res+=String.fromCharCode.apply(String,codePoints.slice(i,i+=MAX_ARGUMENTS_LENGTH))}
return res}
function asciiSlice(buf,start,end){var ret=''
end=Math.min(buf.length,end)
for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i]&0x7F)}
return ret}
function latin1Slice(buf,start,end){var ret=''
end=Math.min(buf.length,end)
for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i])}
return ret}
function hexSlice(buf,start,end){var len=buf.length
if(!start||start<0)start=0
if(!end||end<0||end>len)end=len
var out=''
for(var i=start;i<end;++i){out+=toHex(buf[i])}
return out}
function utf16leSlice(buf,start,end){var bytes=buf.slice(start,end)
var res=''
for(var i=0;i<bytes.length;i+=2){res+=String.fromCharCode(bytes[i]+bytes[i+1]*256)}
return res}
Buffer.prototype.slice=function slice(start,end){var len=this.length
start=~~start
end=end===undefined?len:~~end
if(start<0){start+=len
if(start<0)start=0}else if(start>len){start=len}
if(end<0){end+=len
if(end<0)end=0}else if(end>len){end=len}
if(end<start)end=start
var newBuf
if(Buffer.TYPED_ARRAY_SUPPORT){newBuf=this.subarray(start,end)
newBuf.__proto__=Buffer.prototype}else{var sliceLen=end-start
newBuf=new Buffer(sliceLen,undefined)
for(var i=0;i<sliceLen;++i){newBuf[i]=this[i+start]}}
return newBuf}
function checkOffset(offset,ext,length){if((offset%1)!==0||offset<0)throw new RangeError('offset is not uint')
if(offset+ext>length)throw new RangeError('Trying to access beyond buffer length')}
Buffer.prototype.readUIntLE=function readUIntLE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var val=this[offset]
var mul=1
var i=0
while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul}
return val}
Buffer.prototype.readUIntBE=function readUIntBE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert){checkOffset(offset,byteLength,this.length)}
var val=this[offset+--byteLength]
var mul=1
while(byteLength>0&&(mul*=0x100)){val+=this[offset+--byteLength]*mul}
return val}
Buffer.prototype.readUInt8=function readUInt8(offset,noAssert){if(!noAssert)checkOffset(offset,1,this.length)
return this[offset]}
Buffer.prototype.readUInt16LE=function readUInt16LE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
return this[offset]|(this[offset+1]<<8)}
Buffer.prototype.readUInt16BE=function readUInt16BE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
return(this[offset]<<8)|this[offset+1]}
Buffer.prototype.readUInt32LE=function readUInt32LE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return((this[offset])|(this[offset+1]<<8)|(this[offset+2]<<16))+
(this[offset+3]*0x1000000)}
Buffer.prototype.readUInt32BE=function readUInt32BE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset]*0x1000000)+
((this[offset+1]<<16)|(this[offset+2]<<8)|this[offset+3])}
Buffer.prototype.readIntLE=function readIntLE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var val=this[offset]
var mul=1
var i=0
while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul}
mul*=0x80
if(val>=mul)val-=Math.pow(2,8*byteLength)
return val}
Buffer.prototype.readIntBE=function readIntBE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var i=byteLength
var mul=1
var val=this[offset+--i]
while(i>0&&(mul*=0x100)){val+=this[offset+--i]*mul}
mul*=0x80
if(val>=mul)val-=Math.pow(2,8*byteLength)
return val}
Buffer.prototype.readInt8=function readInt8(offset,noAssert){if(!noAssert)checkOffset(offset,1,this.length)
if(!(this[offset]&0x80))return(this[offset])
return((0xff-this[offset]+1)*-1)}
Buffer.prototype.readInt16LE=function readInt16LE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
var val=this[offset]|(this[offset+1]<<8)
return(val&0x8000)?val|0xFFFF0000:val}
Buffer.prototype.readInt16BE=function readInt16BE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
var val=this[offset+1]|(this[offset]<<8)
return(val&0x8000)?val|0xFFFF0000:val}
Buffer.prototype.readInt32LE=function readInt32LE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset])|(this[offset+1]<<8)|(this[offset+2]<<16)|(this[offset+3]<<24)}
Buffer.prototype.readInt32BE=function readInt32BE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset]<<24)|(this[offset+1]<<16)|(this[offset+2]<<8)|(this[offset+3])}
Buffer.prototype.readFloatLE=function readFloatLE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return ieee754.read(this,offset,true,23,4)}
Buffer.prototype.readFloatBE=function readFloatBE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return ieee754.read(this,offset,false,23,4)}
Buffer.prototype.readDoubleLE=function readDoubleLE(offset,noAssert){if(!noAssert)checkOffset(offset,8,this.length)
return ieee754.read(this,offset,true,52,8)}
Buffer.prototype.readDoubleBE=function readDoubleBE(offset,noAssert){if(!noAssert)checkOffset(offset,8,this.length)
return ieee754.read(this,offset,false,52,8)}
function checkInt(buf,value,offset,ext,max,min){if(!Buffer.isBuffer(buf))throw new TypeError('"buffer" argument must be a Buffer instance')
if(value>max||value<min)throw new RangeError('"value" argument is out of bounds')
if(offset+ext>buf.length)throw new RangeError('Index out of range')}
Buffer.prototype.writeUIntLE=function writeUIntLE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
byteLength=byteLength|0
if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1
checkInt(this,value,offset,byteLength,maxBytes,0)}
var mul=1
var i=0
this[offset]=value&0xFF
while(++i<byteLength&&(mul*=0x100)){this[offset+i]=(value/mul)&0xFF}
return offset+byteLength}
Buffer.prototype.writeUIntBE=function writeUIntBE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
byteLength=byteLength|0
if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1
checkInt(this,value,offset,byteLength,maxBytes,0)}
var i=byteLength-1
var mul=1
this[offset+i]=value&0xFF
while(--i>=0&&(mul*=0x100)){this[offset+i]=(value/mul)&0xFF}
return offset+byteLength}
Buffer.prototype.writeUInt8=function writeUInt8(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,1,0xff,0)
if(!Buffer.TYPED_ARRAY_SUPPORT)value=Math.floor(value)
this[offset]=(value&0xff)
return offset+1}
function objectWriteUInt16(buf,value,offset,littleEndian){if(value<0)value=0xffff+value+1
for(var i=0,j=Math.min(buf.length-offset,2);i<j;++i){buf[offset+i]=(value&(0xff<<(8*(littleEndian?i:1-i))))>>>(littleEndian?i:1-i)*8}}
Buffer.prototype.writeUInt16LE=function writeUInt16LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0xffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value&0xff)
this[offset+1]=(value>>>8)}else{objectWriteUInt16(this,value,offset,true)}
return offset+2}
Buffer.prototype.writeUInt16BE=function writeUInt16BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0xffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>8)
this[offset+1]=(value&0xff)}else{objectWriteUInt16(this,value,offset,false)}
return offset+2}
function objectWriteUInt32(buf,value,offset,littleEndian){if(value<0)value=0xffffffff+value+1
for(var i=0,j=Math.min(buf.length-offset,4);i<j;++i){buf[offset+i]=(value>>>(littleEndian?i:3-i)*8)&0xff}}
Buffer.prototype.writeUInt32LE=function writeUInt32LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset+3]=(value>>>24)
this[offset+2]=(value>>>16)
this[offset+1]=(value>>>8)
this[offset]=(value&0xff)}else{objectWriteUInt32(this,value,offset,true)}
return offset+4}
Buffer.prototype.writeUInt32BE=function writeUInt32BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>24)
this[offset+1]=(value>>>16)
this[offset+2]=(value>>>8)
this[offset+3]=(value&0xff)}else{objectWriteUInt32(this,value,offset,false)}
return offset+4}
Buffer.prototype.writeIntLE=function writeIntLE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
if(!noAssert){var limit=Math.pow(2,8*byteLength-1)
checkInt(this,value,offset,byteLength,limit-1,-limit)}
var i=0
var mul=1
var sub=0
this[offset]=value&0xFF
while(++i<byteLength&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i-1]!==0){sub=1}
this[offset+i]=((value/mul)>>0)-sub&0xFF}
return offset+byteLength}
Buffer.prototype.writeIntBE=function writeIntBE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
if(!noAssert){var limit=Math.pow(2,8*byteLength-1)
checkInt(this,value,offset,byteLength,limit-1,-limit)}
var i=byteLength-1
var mul=1
var sub=0
this[offset+i]=value&0xFF
while(--i>=0&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i+1]!==0){sub=1}
this[offset+i]=((value/mul)>>0)-sub&0xFF}
return offset+byteLength}
Buffer.prototype.writeInt8=function writeInt8(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,1,0x7f,-0x80)
if(!Buffer.TYPED_ARRAY_SUPPORT)value=Math.floor(value)
if(value<0)value=0xff+value+1
this[offset]=(value&0xff)
return offset+1}
Buffer.prototype.writeInt16LE=function writeInt16LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value&0xff)
this[offset+1]=(value>>>8)}else{objectWriteUInt16(this,value,offset,true)}
return offset+2}
Buffer.prototype.writeInt16BE=function writeInt16BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>8)
this[offset+1]=(value&0xff)}else{objectWriteUInt16(this,value,offset,false)}
return offset+2}
Buffer.prototype.writeInt32LE=function writeInt32LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value&0xff)
this[offset+1]=(value>>>8)
this[offset+2]=(value>>>16)
this[offset+3]=(value>>>24)}else{objectWriteUInt32(this,value,offset,true)}
return offset+4}
Buffer.prototype.writeInt32BE=function writeInt32BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000)
if(value<0)value=0xffffffff+value+1
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>24)
this[offset+1]=(value>>>16)
this[offset+2]=(value>>>8)
this[offset+3]=(value&0xff)}else{objectWriteUInt32(this,value,offset,false)}
return offset+4}
function checkIEEE754(buf,value,offset,ext,max,min){if(offset+ext>buf.length)throw new RangeError('Index out of range')
if(offset<0)throw new RangeError('Index out of range')}
function writeFloat(buf,value,offset,littleEndian,noAssert){if(!noAssert){checkIEEE754(buf,value,offset,4,3.4028234663852886e+38,-3.4028234663852886e+38)}
ieee754.write(buf,value,offset,littleEndian,23,4)
return offset+4}
Buffer.prototype.writeFloatLE=function writeFloatLE(value,offset,noAssert){return writeFloat(this,value,offset,true,noAssert)}
Buffer.prototype.writeFloatBE=function writeFloatBE(value,offset,noAssert){return writeFloat(this,value,offset,false,noAssert)}
function writeDouble(buf,value,offset,littleEndian,noAssert){if(!noAssert){checkIEEE754(buf,value,offset,8,1.7976931348623157E+308,-1.7976931348623157E+308)}
ieee754.write(buf,value,offset,littleEndian,52,8)
return offset+8}
Buffer.prototype.writeDoubleLE=function writeDoubleLE(value,offset,noAssert){return writeDouble(this,value,offset,true,noAssert)}
Buffer.prototype.writeDoubleBE=function writeDoubleBE(value,offset,noAssert){return writeDouble(this,value,offset,false,noAssert)}
Buffer.prototype.copy=function copy(target,targetStart,start,end){if(!start)start=0
if(!end&&end!==0)end=this.length
if(targetStart>=target.length)targetStart=target.length
if(!targetStart)targetStart=0
if(end>0&&end<start)end=start
if(end===start)return 0
if(target.length===0||this.length===0)return 0
if(targetStart<0){throw new RangeError('targetStart out of bounds')}
if(start<0||start>=this.length)throw new RangeError('sourceStart out of bounds')
if(end<0)throw new RangeError('sourceEnd out of bounds')
if(end>this.length)end=this.length
if(target.length-targetStart<end-start){end=target.length-targetStart+start}
var len=end-start
var i
if(this===target&&start<targetStart&&targetStart<end){for(i=len-1;i>=0;--i){target[i+targetStart]=this[i+start]}}else if(len<1000||!Buffer.TYPED_ARRAY_SUPPORT){for(i=0;i<len;++i){target[i+targetStart]=this[i+start]}}else{Uint8Array.prototype.set.call(target,this.subarray(start,start+len),targetStart)}
return len}
Buffer.prototype.fill=function fill(val,start,end,encoding){if(typeof val==='string'){if(typeof start==='string'){encoding=start
start=0
end=this.length}else if(typeof end==='string'){encoding=end
end=this.length}
if(val.length===1){var code=val.charCodeAt(0)
if(code<256){val=code}}
if(encoding!==undefined&&typeof encoding!=='string'){throw new TypeError('encoding must be a string')}
if(typeof encoding==='string'&&!Buffer.isEncoding(encoding)){throw new TypeError('Unknown encoding: '+encoding)}}else if(typeof val==='number'){val=val&255}
if(start<0||this.length<start||this.length<end){throw new RangeError('Out of range index')}
if(end<=start){return this}
start=start>>>0
end=end===undefined?this.length:end>>>0
if(!val)val=0
var i
if(typeof val==='number'){for(i=start;i<end;++i){this[i]=val}}else{var bytes=Buffer.isBuffer(val)?val:utf8ToBytes(new Buffer(val,encoding).toString())
var len=bytes.length
for(i=0;i<end-start;++i){this[i+start]=bytes[i%len]}}
return this}
var INVALID_BASE64_RE=/[^+\/0-9A-Za-z-_]/g
function base64clean(str){str=stringtrim(str).replace(INVALID_BASE64_RE,'')
if(str.length<2)return ''
while(str.length%4!==0){str=str+'='}
return str}
function stringtrim(str){if(str.trim)return str.trim()
return str.replace(/^\s+|\s+$/g,'')}
function toHex(n){if(n<16)return '0'+n.toString(16)
return n.toString(16)}
function utf8ToBytes(string,units){units=units||Infinity
var codePoint
var length=string.length
var leadSurrogate=null
var bytes=[]
for(var i=0;i<length;++i){codePoint=string.charCodeAt(i)
if(codePoint>0xD7FF&&codePoint<0xE000){if(!leadSurrogate){if(codePoint>0xDBFF){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
continue}else if(i+1===length){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
continue}
leadSurrogate=codePoint
continue}
if(codePoint<0xDC00){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
leadSurrogate=codePoint
continue}
codePoint=(leadSurrogate-0xD800<<10|codePoint-0xDC00)+0x10000}else if(leadSurrogate){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)}
leadSurrogate=null
if(codePoint<0x80){if((units-=1)<0)break
bytes.push(codePoint)}else if(codePoint<0x800){if((units-=2)<0)break
bytes.push(codePoint>>0x6|0xC0,codePoint&0x3F|0x80)}else if(codePoint<0x10000){if((units-=3)<0)break
bytes.push(codePoint>>0xC|0xE0,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80)}else if(codePoint<0x110000){if((units-=4)<0)break
bytes.push(codePoint>>0x12|0xF0,codePoint>>0xC&0x3F|0x80,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80)}else{throw new Error('Invalid code point')}}
return bytes}
function asciiToBytes(str){var byteArray=[]
for(var i=0;i<str.length;++i){byteArray.push(str.charCodeAt(i)&0xFF)}
return byteArray}
function utf16leToBytes(str,units){var c,hi,lo
var byteArray=[]
for(var i=0;i<str.length;++i){if((units-=2)<0)break
c=str.charCodeAt(i)
hi=c>>8
lo=c%256
byteArray.push(lo)
byteArray.push(hi)}
return byteArray}
function base64ToBytes(str){return base64.toByteArray(base64clean(str))}
function blitBuffer(src,dst,offset,length){for(var i=0;i<length;++i){if((i+offset>=dst.length)||(i>=src.length))break
dst[i+offset]=src[i]}
return i}
function isnan(val){return val!==val}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"base64-js":39,"ieee754":80,"isarray":83}],78:[function(require,module,exports){(function(Buffer){function isArray(arg){if(Array.isArray){return Array.isArray(arg);}
return objectToString(arg)==='[object Array]';}
exports.isArray=isArray;function isBoolean(arg){return typeof arg==='boolean';}
exports.isBoolean=isBoolean;function isNull(arg){return arg===null;}
exports.isNull=isNull;function isNullOrUndefined(arg){return arg==null;}
exports.isNullOrUndefined=isNullOrUndefined;function isNumber(arg){return typeof arg==='number';}
exports.isNumber=isNumber;function isString(arg){return typeof arg==='string';}
exports.isString=isString;function isSymbol(arg){return typeof arg==='symbol';}
exports.isSymbol=isSymbol;function isUndefined(arg){return arg===void 0;}
exports.isUndefined=isUndefined;function isRegExp(re){return objectToString(re)==='[object RegExp]';}
exports.isRegExp=isRegExp;function isObject(arg){return typeof arg==='object'&&arg!==null;}
exports.isObject=isObject;function isDate(d){return objectToString(d)==='[object Date]';}
exports.isDate=isDate;function isError(e){return(objectToString(e)==='[object Error]'||e instanceof Error);}
exports.isError=isError;function isFunction(arg){return typeof arg==='function';}
exports.isFunction=isFunction;function isPrimitive(arg){return arg===null||typeof arg==='boolean'||typeof arg==='number'||typeof arg==='string'||typeof arg==='symbol'||typeof arg==='undefined';}
exports.isPrimitive=isPrimitive;exports.isBuffer=Buffer.isBuffer;function objectToString(o){return Object.prototype.toString.call(o);}}).call(this,{"isBuffer":require("../../is-buffer/index.js")})},{"../../is-buffer/index.js":82}],79:[function(require,module,exports){function EventEmitter(){this._events=this._events||{};this._maxListeners=this._maxListeners||undefined;}
module.exports=EventEmitter;EventEmitter.EventEmitter=EventEmitter;EventEmitter.prototype._events=undefined;EventEmitter.prototype._maxListeners=undefined;EventEmitter.defaultMaxListeners=10;EventEmitter.prototype.setMaxListeners=function(n){if(!isNumber(n)||n<0||isNaN(n))
throw TypeError('n must be a positive number');this._maxListeners=n;return this;};EventEmitter.prototype.emit=function(type){var er,handler,len,args,i,listeners;if(!this._events)
this._events={};if(type==='error'){if(!this._events.error||(isObject(this._events.error)&&!this._events.error.length)){er=arguments[1];if(er instanceof Error){throw er;}else{var err=new Error('Uncaught, unspecified "error" event. ('+er+')');err.context=er;throw err;}}}
handler=this._events[type];if(isUndefined(handler))
return false;if(isFunction(handler)){switch(arguments.length){case 1:handler.call(this);break;case 2:handler.call(this,arguments[1]);break;case 3:handler.call(this,arguments[1],arguments[2]);break;default:args=Array.prototype.slice.call(arguments,1);handler.apply(this,args);}}else if(isObject(handler)){args=Array.prototype.slice.call(arguments,1);listeners=handler.slice();len=listeners.length;for(i=0;i<len;i++)
listeners[i].apply(this,args);}
return true;};EventEmitter.prototype.addListener=function(type,listener){var m;if(!isFunction(listener))
throw TypeError('listener must be a function');if(!this._events)
this._events={};if(this._events.newListener)
this.emit('newListener',type,isFunction(listener.listener)?listener.listener:listener);if(!this._events[type])
this._events[type]=listener;else if(isObject(this._events[type]))
this._events[type].push(listener);else
this._events[type]=[this._events[type],listener];if(isObject(this._events[type])&&!this._events[type].warned){if(!isUndefined(this._maxListeners)){m=this._maxListeners;}else{m=EventEmitter.defaultMaxListeners;}
if(m&&m>0&&this._events[type].length>m){this._events[type].warned=true;console.error('(node) warning: possible EventEmitter memory '+
'leak detected. %d listeners added. '+
'Use emitter.setMaxListeners() to increase limit.',this._events[type].length);if(typeof console.trace==='function'){console.trace();}}}
return this;};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.once=function(type,listener){if(!isFunction(listener))
throw TypeError('listener must be a function');var fired=false;function g(){this.removeListener(type,g);if(!fired){fired=true;listener.apply(this,arguments);}}
g.listener=listener;this.on(type,g);return this;};EventEmitter.prototype.removeListener=function(type,listener){var list,position,length,i;if(!isFunction(listener))
throw TypeError('listener must be a function');if(!this._events||!this._events[type])
return this;list=this._events[type];length=list.length;position=-1;if(list===listener||(isFunction(list.listener)&&list.listener===listener)){delete this._events[type];if(this._events.removeListener)
this.emit('removeListener',type,listener);}else if(isObject(list)){for(i=length;i-->0;){if(list[i]===listener||(list[i].listener&&list[i].listener===listener)){position=i;break;}}
if(position<0)
return this;if(list.length===1){list.length=0;delete this._events[type];}else{list.splice(position,1);}
if(this._events.removeListener)
this.emit('removeListener',type,listener);}
return this;};EventEmitter.prototype.removeAllListeners=function(type){var key,listeners;if(!this._events)
return this;if(!this._events.removeListener){if(arguments.length===0)
this._events={};else if(this._events[type])
delete this._events[type];return this;}
if(arguments.length===0){for(key in this._events){if(key==='removeListener')continue;this.removeAllListeners(key);}
this.removeAllListeners('removeListener');this._events={};return this;}
listeners=this._events[type];if(isFunction(listeners)){this.removeListener(type,listeners);}else if(listeners){while(listeners.length)
this.removeListener(type,listeners[listeners.length-1]);}
delete this._events[type];return this;};EventEmitter.prototype.listeners=function(type){var ret;if(!this._events||!this._events[type])
ret=[];else if(isFunction(this._events[type]))
ret=[this._events[type]];else
ret=this._events[type].slice();return ret;};EventEmitter.prototype.listenerCount=function(type){if(this._events){var evlistener=this._events[type];if(isFunction(evlistener))
return 1;else if(evlistener)
return evlistener.length;}
return 0;};EventEmitter.listenerCount=function(emitter,type){return emitter.listenerCount(type);};function isFunction(arg){return typeof arg==='function';}
function isNumber(arg){return typeof arg==='number';}
function isObject(arg){return typeof arg==='object'&&arg!==null;}
function isUndefined(arg){return arg===void 0;}},{}],80:[function(require,module,exports){exports.read=function(buffer,offset,isLE,mLen,nBytes){var e,m
var eLen=nBytes*8-mLen-1
var eMax=(1<<eLen)-1
var eBias=eMax>>1
var nBits=-7
var i=isLE?(nBytes-1):0
var d=isLE?-1:1
var s=buffer[offset+i]
i+=d
e=s&((1<<(-nBits))-1)
s>>=(-nBits)
nBits+=eLen
for(;nBits>0;e=e*256+buffer[offset+i],i+=d,nBits-=8){}
m=e&((1<<(-nBits))-1)
e>>=(-nBits)
nBits+=mLen
for(;nBits>0;m=m*256+buffer[offset+i],i+=d,nBits-=8){}
if(e===0){e=1-eBias}else if(e===eMax){return m?NaN:((s?-1:1)*Infinity)}else{m=m+Math.pow(2,mLen)
e=e-eBias}
return(s?-1:1)*m*Math.pow(2,e-mLen)}
exports.write=function(buffer,value,offset,isLE,mLen,nBytes){var e,m,c
var eLen=nBytes*8-mLen-1
var eMax=(1<<eLen)-1
var eBias=eMax>>1
var rt=(mLen===23?Math.pow(2,-24)-Math.pow(2,-77):0)
var i=isLE?0:(nBytes-1)
var d=isLE?1:-1
var s=value<0||(value===0&&1/value<0)?1:0
value=Math.abs(value)
if(isNaN(value)||value===Infinity){m=isNaN(value)?1:0
e=eMax}else{e=Math.floor(Math.log(value)/Math.LN2)
if(value*(c=Math.pow(2,-e))<1){e--
c*=2}
if(e+eBias>=1){value+=rt/c}else{value+=rt*Math.pow(2,1-eBias)}
if(value*c>=2){e++
c/=2}
if(e+eBias>=eMax){m=0
e=eMax}else if(e+eBias>=1){m=(value*c-1)*Math.pow(2,mLen)
e=e+eBias}else{m=value*Math.pow(2,eBias-1)*Math.pow(2,mLen)
e=0}}
for(;mLen>=8;buffer[offset+i]=m&0xff,i+=d,m/=256,mLen-=8){}
e=(e<<mLen)|m
eLen+=mLen
for(;eLen>0;buffer[offset+i]=e&0xff,i+=d,e/=256,eLen-=8){}
buffer[offset+i-d]|=s*128}},{}],81:[function(require,module,exports){if(typeof Object.create==='function'){module.exports=function inherits(ctor,superCtor){ctor.super_=superCtor
ctor.prototype=Object.create(superCtor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}});};}else{module.exports=function inherits(ctor,superCtor){ctor.super_=superCtor
var TempCtor=function(){}
TempCtor.prototype=superCtor.prototype
ctor.prototype=new TempCtor()
ctor.prototype.constructor=ctor}}},{}],82:[function(require,module,exports){/*!
* Determine if an object is a Buffer
*
* @author Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
* @license MIT
*/module.exports=function(obj){return obj!=null&&(isBuffer(obj)||isSlowBuffer(obj)||!!obj._isBuffer)}
function isBuffer(obj){return!!obj.constructor&&typeof obj.constructor.isBuffer==='function'&&obj.constructor.isBuffer(obj)}
function isSlowBuffer(obj){return typeof obj.readFloatLE==='function'&&typeof obj.slice==='function'&&isBuffer(obj.slice(0,0))}},{}],83:[function(require,module,exports){var toString={}.toString;module.exports=Array.isArray||function(arr){return toString.call(arr)=='[object Array]';};},{}],84:[function(require,module,exports){'use strict';var _keyStr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";exports.encode=function(input,utf8){var output="";var chr1,chr2,chr3,enc1,enc2,enc3,enc4;var i=0;while(i<input.length){chr1=input.charCodeAt(i++);chr2=input.charCodeAt(i++);chr3=input.charCodeAt(i++);enc1=chr1>>2;enc2=((chr1&3)<<4)|(chr2>>4);enc3=((chr2&15)<<2)|(chr3>>6);enc4=chr3&63;if(isNaN(chr2)){enc3=enc4=64;}
else if(isNaN(chr3)){enc4=64;}
output=output+_keyStr.charAt(enc1)+_keyStr.charAt(enc2)+_keyStr.charAt(enc3)+_keyStr.charAt(enc4);}
return output;};exports.decode=function(input,utf8){var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(i<input.length){enc1=_keyStr.indexOf(input.charAt(i++));enc2=_keyStr.indexOf(input.charAt(i++));enc3=_keyStr.indexOf(input.charAt(i++));enc4=_keyStr.indexOf(input.charAt(i++));chr1=(enc1<<2)|(enc2>>4);chr2=((enc2&15)<<4)|(enc3>>2);chr3=((enc3&3)<<6)|enc4;output=output+String.fromCharCode(chr1);if(enc3!=64){output=output+String.fromCharCode(chr2);}
if(enc4!=64){output=output+String.fromCharCode(chr3);}}
return output;};},{}],85:[function(require,module,exports){'use strict';function CompressedObject(){this.compressedSize=0;this.uncompressedSize=0;this.crc32=0;this.compressionMethod=null;this.compressedContent=null;}
CompressedObject.prototype={getContent:function(){return null;},getCompressedContent:function(){return null;}};module.exports=CompressedObject;},{}],86:[function(require,module,exports){'use strict';exports.STORE={magic:"\x00\x00",compress:function(content,compressionOptions){return content;},uncompress:function(content){return content;},compressInputType:null,uncompressInputType:null};exports.DEFLATE=require('./flate');},{"./flate":91}],87:[function(require,module,exports){'use strict';var utils=require('./utils');var table=[0x00000000,0x77073096,0xEE0E612C,0x990951BA,0x076DC419,0x706AF48F,0xE963A535,0x9E6495A3,0x0EDB8832,0x79DCB8A4,0xE0D5E91E,0x97D2D988,0x09B64C2B,0x7EB17CBD,0xE7B82D07,0x90BF1D91,0x1DB71064,0x6AB020F2,0xF3B97148,0x84BE41DE,0x1ADAD47D,0x6DDDE4EB,0xF4D4B551,0x83D385C7,0x136C9856,0x646BA8C0,0xFD62F97A,0x8A65C9EC,0x14015C4F,0x63066CD9,0xFA0F3D63,0x8D080DF5,0x3B6E20C8,0x4C69105E,0xD56041E4,0xA2677172,0x3C03E4D1,0x4B04D447,0xD20D85FD,0xA50AB56B,0x35B5A8FA,0x42B2986C,0xDBBBC9D6,0xACBCF940,0x32D86CE3,0x45DF5C75,0xDCD60DCF,0xABD13D59,0x26D930AC,0x51DE003A,0xC8D75180,0xBFD06116,0x21B4F4B5,0x56B3C423,0xCFBA9599,0xB8BDA50F,0x2802B89E,0x5F058808,0xC60CD9B2,0xB10BE924,0x2F6F7C87,0x58684C11,0xC1611DAB,0xB6662D3D,0x76DC4190,0x01DB7106,0x98D220BC,0xEFD5102A,0x71B18589,0x06B6B51F,0x9FBFE4A5,0xE8B8D433,0x7807C9A2,0x0F00F934,0x9609A88E,0xE10E9818,0x7F6A0DBB,0x086D3D2D,0x91646C97,0xE6635C01,0x6B6B51F4,0x1C6C6162,0x856530D8,0xF262004E,0x6C0695ED,0x1B01A57B,0x8208F4C1,0xF50FC457,0x65B0D9C6,0x12B7E950,0x8BBEB8EA,0xFCB9887C,0x62DD1DDF,0x15DA2D49,0x8CD37CF3,0xFBD44C65,0x4DB26158,0x3AB551CE,0xA3BC0074,0xD4BB30E2,0x4ADFA541,0x3DD895D7,0xA4D1C46D,0xD3D6F4FB,0x4369E96A,0x346ED9FC,0xAD678846,0xDA60B8D0,0x44042D73,0x33031DE5,0xAA0A4C5F,0xDD0D7CC9,0x5005713C,0x270241AA,0xBE0B1010,0xC90C2086,0x5768B525,0x206F85B3,0xB966D409,0xCE61E49F,0x5EDEF90E,0x29D9C998,0xB0D09822,0xC7D7A8B4,0x59B33D17,0x2EB40D81,0xB7BD5C3B,0xC0BA6CAD,0xEDB88320,0x9ABFB3B6,0x03B6E20C,0x74B1D29A,0xEAD54739,0x9DD277AF,0x04DB2615,0x73DC1683,0xE3630B12,0x94643B84,0x0D6D6A3E,0x7A6A5AA8,0xE40ECF0B,0x9309FF9D,0x0A00AE27,0x7D079EB1,0xF00F9344,0x8708A3D2,0x1E01F268,0x6906C2FE,0xF762575D,0x806567CB,0x196C3671,0x6E6B06E7,0xFED41B76,0x89D32BE0,0x10DA7A5A,0x67DD4ACC,0xF9B9DF6F,0x8EBEEFF9,0x17B7BE43,0x60B08ED5,0xD6D6A3E8,0xA1D1937E,0x38D8C2C4,0x4FDFF252,0xD1BB67F1,0xA6BC5767,0x3FB506DD,0x48B2364B,0xD80D2BDA,0xAF0A1B4C,0x36034AF6,0x41047A60,0xDF60EFC3,0xA867DF55,0x316E8EEF,0x4669BE79,0xCB61B38C,0xBC66831A,0x256FD2A0,0x5268E236,0xCC0C7795,0xBB0B4703,0x220216B9,0x5505262F,0xC5BA3BBE,0xB2BD0B28,0x2BB45A92,0x5CB36A04,0xC2D7FFA7,0xB5D0CF31,0x2CD99E8B,0x5BDEAE1D,0x9B64C2B0,0xEC63F226,0x756AA39C,0x026D930A,0x9C0906A9,0xEB0E363F,0x72076785,0x05005713,0x95BF4A82,0xE2B87A14,0x7BB12BAE,0x0CB61B38,0x92D28E9B,0xE5D5BE0D,0x7CDCEFB7,0x0BDBDF21,0x86D3D2D4,0xF1D4E242,0x68DDB3F8,0x1FDA836E,0x81BE16CD,0xF6B9265B,0x6FB077E1,0x18B74777,0x88085AE6,0xFF0F6A70,0x66063BCA,0x11010B5C,0x8F659EFF,0xF862AE69,0x616BFFD3,0x166CCF45,0xA00AE278,0xD70DD2EE,0x4E048354,0x3903B3C2,0xA7672661,0xD06016F7,0x4969474D,0x3E6E77DB,0xAED16A4A,0xD9D65ADC,0x40DF0B66,0x37D83BF0,0xA9BCAE53,0xDEBB9EC5,0x47B2CF7F,0x30B5FFE9,0xBDBDF21C,0xCABAC28A,0x53B39330,0x24B4A3A6,0xBAD03605,0xCDD70693,0x54DE5729,0x23D967BF,0xB3667A2E,0xC4614AB8,0x5D681B02,0x2A6F2B94,0xB40BBE37,0xC30C8EA1,0x5A05DF1B,0x2D02EF8D];module.exports=function crc32(input,crc){if(typeof input==="undefined"||!input.length){return 0;}
var isArray=utils.getTypeOf(input)!=="string";if(typeof(crc)=="undefined"){crc=0;}
var x=0;var y=0;var b=0;crc=crc^(-1);for(var i=0,iTop=input.length;i<iTop;i++){b=isArray?input[i]:input.charCodeAt(i);y=(crc^b)&0xFF;x=table[y];crc=(crc>>>8)^x;}
return crc^(-1);};},{"./utils":104}],88:[function(require,module,exports){'use strict';var utils=require('./utils');function DataReader(data){this.data=null;this.length=0;this.index=0;}
DataReader.prototype={checkOffset:function(offset){this.checkIndex(this.index+offset);},checkIndex:function(newIndex){if(this.length<newIndex||newIndex<0){throw new Error("End of data reached (data length = "+this.length+", asked index = "+(newIndex)+"). Corrupted zip ?");}},setIndex:function(newIndex){this.checkIndex(newIndex);this.index=newIndex;},skip:function(n){this.setIndex(this.index+n);},byteAt:function(i){},readInt:function(size){var result=0,i;this.checkOffset(size);for(i=this.index+size-1;i>=this.index;i--){result=(result<<8)+this.byteAt(i);}
this.index+=size;return result;},readString:function(size){return utils.transformTo("string",this.readData(size));},readData:function(size){},lastIndexOfSignature:function(sig){},readDate:function(){var dostime=this.readInt(4);return new Date(((dostime>>25)&0x7f)+1980,((dostime>>21)&0x0f)-1,(dostime>>16)&0x1f,(dostime>>11)&0x1f,(dostime>>5)&0x3f,(dostime&0x1f)<<1);}};module.exports=DataReader;},{"./utils":104}],89:[function(require,module,exports){'use strict';exports.base64=false;exports.binary=false;exports.dir=false;exports.createFolders=false;exports.date=null;exports.compression=null;exports.compressionOptions=null;exports.comment=null;exports.unixPermissions=null;exports.dosPermissions=null;},{}],90:[function(require,module,exports){'use strict';var utils=require('./utils');exports.string2binary=function(str){return utils.string2binary(str);};exports.string2Uint8Array=function(str){return utils.transformTo("uint8array",str);};exports.uint8Array2String=function(array){return utils.transformTo("string",array);};exports.string2Blob=function(str){var buffer=utils.transformTo("arraybuffer",str);return utils.arrayBuffer2Blob(buffer);};exports.arrayBuffer2Blob=function(buffer){return utils.arrayBuffer2Blob(buffer);};exports.transformTo=function(outputType,input){return utils.transformTo(outputType,input);};exports.getTypeOf=function(input){return utils.getTypeOf(input);};exports.checkSupport=function(type){return utils.checkSupport(type);};exports.MAX_VALUE_16BITS=utils.MAX_VALUE_16BITS;exports.MAX_VALUE_32BITS=utils.MAX_VALUE_32BITS;exports.pretty=function(str){return utils.pretty(str);};exports.findCompression=function(compressionMethod){return utils.findCompression(compressionMethod);};exports.isRegExp=function(object){return utils.isRegExp(object);};},{"./utils":104}],91:[function(require,module,exports){'use strict';var USE_TYPEDARRAY=(typeof Uint8Array!=='undefined')&&(typeof Uint16Array!=='undefined')&&(typeof Uint32Array!=='undefined');var pako=require("pako");exports.uncompressInputType=USE_TYPEDARRAY?"uint8array":"array";exports.compressInputType=USE_TYPEDARRAY?"uint8array":"array";exports.magic="\x08\x00";exports.compress=function(input,compressionOptions){return pako.deflateRaw(input,{level:compressionOptions.level||-1});};exports.uncompress=function(input){return pako.inflateRaw(input);};},{"pako":120}],92:[function(require,module,exports){'use strict';var base64=require('./base64');function JSZip(data,options){if(!(this instanceof JSZip))return new JSZip(data,options);this.files={};this.comment=null;this.root="";if(data){this.load(data,options);}
this.clone=function(){var newObj=new JSZip();for(var i in this){if(typeof this[i]!=="function"){newObj[i]=this[i];}}
return newObj;};}
JSZip.prototype=require('./object');JSZip.prototype.load=require('./load');JSZip.support=require('./support');JSZip.defaults=require('./defaults');JSZip.utils=require('./deprecatedPublicUtils');JSZip.base64={encode:function(input){return base64.encode(input);},decode:function(input){return base64.decode(input);}};JSZip.compressions=require('./compressions');module.exports=JSZip;},{"./base64":84,"./compressions":86,"./defaults":89,"./deprecatedPublicUtils":90,"./load":93,"./object":96,"./support":100}],93:[function(require,module,exports){'use strict';var base64=require('./base64');var ZipEntries=require('./zipEntries');module.exports=function(data,options){var files,zipEntries,i,input;options=options||{};if(options.base64){data=base64.decode(data);}
zipEntries=new ZipEntries(data,options);files=zipEntries.files;for(i=0;i<files.length;i++){input=files[i];this.file(input.fileName,input.decompressed,{binary:true,optimizedBinaryString:true,date:input.date,dir:input.dir,comment:input.fileComment.length?input.fileComment:null,unixPermissions:input.unixPermissions,dosPermissions:input.dosPermissions,createFolders:options.createFolders});}
if(zipEntries.zipComment.length){this.comment=zipEntries.zipComment;}
return this;};},{"./base64":84,"./zipEntries":105}],94:[function(require,module,exports){(function(Buffer){'use strict';module.exports=function(data,encoding){return new Buffer(data,encoding);};module.exports.test=function(b){return Buffer.isBuffer(b);};}).call(this,require("buffer").Buffer)},{"buffer":77}],95:[function(require,module,exports){'use strict';var Uint8ArrayReader=require('./uint8ArrayReader');function NodeBufferReader(data){this.data=data;this.length=this.data.length;this.index=0;}
NodeBufferReader.prototype=new Uint8ArrayReader();NodeBufferReader.prototype.readData=function(size){this.checkOffset(size);var result=this.data.slice(this.index,this.index+size);this.index+=size;return result;};module.exports=NodeBufferReader;},{"./uint8ArrayReader":101}],96:[function(require,module,exports){'use strict';var support=require('./support');var utils=require('./utils');var crc32=require('./crc32');var signature=require('./signature');var defaults=require('./defaults');var base64=require('./base64');var compressions=require('./compressions');var CompressedObject=require('./compressedObject');var nodeBuffer=require('./nodeBuffer');var utf8=require('./utf8');var StringWriter=require('./stringWriter');var Uint8ArrayWriter=require('./uint8ArrayWriter');var getRawData=function(file){if(file._data instanceof CompressedObject){file._data=file._data.getContent();file.options.binary=true;file.options.base64=false;if(utils.getTypeOf(file._data)==="uint8array"){var copy=file._data;file._data=new Uint8Array(copy.length);if(copy.length!==0){file._data.set(copy,0);}}}
return file._data;};var getBinaryData=function(file){var result=getRawData(file),type=utils.getTypeOf(result);if(type==="string"){if(!file.options.binary){if(support.nodebuffer){return nodeBuffer(result,"utf-8");}}
return file.asBinary();}
return result;};var dataToString=function(asUTF8){var result=getRawData(this);if(result===null||typeof result==="undefined"){return "";}
if(this.options.base64){result=base64.decode(result);}
if(asUTF8&&this.options.binary){result=out.utf8decode(result);}
else{result=utils.transformTo("string",result);}
if(!asUTF8&&!this.options.binary){result=utils.transformTo("string",out.utf8encode(result));}
return result;};var ZipObject=function(name,data,options){this.name=name;this.dir=options.dir;this.date=options.date;this.comment=options.comment;this.unixPermissions=options.unixPermissions;this.dosPermissions=options.dosPermissions;this._data=data;this.options=options;this._initialMetadata={dir:options.dir,date:options.date};};ZipObject.prototype={asText:function(){return dataToString.call(this,true);},asBinary:function(){return dataToString.call(this,false);},asNodeBuffer:function(){var result=getBinaryData(this);return utils.transformTo("nodebuffer",result);},asUint8Array:function(){var result=getBinaryData(this);return utils.transformTo("uint8array",result);},asArrayBuffer:function(){return this.asUint8Array().buffer;}};var decToHex=function(dec,bytes){var hex="",i;for(i=0;i<bytes;i++){hex+=String.fromCharCode(dec&0xff);dec=dec>>>8;}
return hex;};var extend=function(){var result={},i,attr;for(i=0;i<arguments.length;i++){for(attr in arguments[i]){if(arguments[i].hasOwnProperty(attr)&&typeof result[attr]==="undefined"){result[attr]=arguments[i][attr];}}}
return result;};var prepareFileAttrs=function(o){o=o||{};if(o.base64===true&&(o.binary===null||o.binary===undefined)){o.binary=true;}
o=extend(o,defaults);o.date=o.date||new Date();if(o.compression!==null)o.compression=o.compression.toUpperCase();return o;};var fileAdd=function(name,data,o){var dataType=utils.getTypeOf(data),parent;o=prepareFileAttrs(o);if(typeof o.unixPermissions==="string"){o.unixPermissions=parseInt(o.unixPermissions,8);}
if(o.unixPermissions&&(o.unixPermissions&0x4000)){o.dir=true;}
if(o.dosPermissions&&(o.dosPermissions&0x0010)){o.dir=true;}
if(o.dir){name=forceTrailingSlash(name);}
if(o.createFolders&&(parent=parentFolder(name))){folderAdd.call(this,parent,true);}
if(o.dir||data===null||typeof data==="undefined"){o.base64=false;o.binary=false;data=null;dataType=null;}
else if(dataType==="string"){if(o.binary&&!o.base64){if(o.optimizedBinaryString!==true){data=utils.string2binary(data);}}}
else{o.base64=false;o.binary=true;if(!dataType&&!(data instanceof CompressedObject)){throw new Error("The data of '"+name+"' is in an unsupported format !");}
if(dataType==="arraybuffer"){data=utils.transformTo("uint8array",data);}}
var object=new ZipObject(name,data,o);this.files[name]=object;return object;};var parentFolder=function(path){if(path.slice(-1)=='/'){path=path.substring(0,path.length-1);}
var lastSlash=path.lastIndexOf('/');return(lastSlash>0)?path.substring(0,lastSlash):"";};var forceTrailingSlash=function(path){if(path.slice(-1)!="/"){path+="/";}
return path;};var folderAdd=function(name,createFolders){createFolders=(typeof createFolders!=='undefined')?createFolders:false;name=forceTrailingSlash(name);if(!this.files[name]){fileAdd.call(this,name,null,{dir:true,createFolders:createFolders});}
return this.files[name];};var generateCompressedObjectFrom=function(file,compression,compressionOptions){var result=new CompressedObject(),content;if(file._data instanceof CompressedObject){result.uncompressedSize=file._data.uncompressedSize;result.crc32=file._data.crc32;if(result.uncompressedSize===0||file.dir){compression=compressions['STORE'];result.compressedContent="";result.crc32=0;}
else if(file._data.compressionMethod===compression.magic){result.compressedContent=file._data.getCompressedContent();}
else{content=file._data.getContent();result.compressedContent=compression.compress(utils.transformTo(compression.compressInputType,content),compressionOptions);}}
else{content=getBinaryData(file);if(!content||content.length===0||file.dir){compression=compressions['STORE'];content="";}
result.uncompressedSize=content.length;result.crc32=crc32(content);result.compressedContent=compression.compress(utils.transformTo(compression.compressInputType,content),compressionOptions);}
result.compressedSize=result.compressedContent.length;result.compressionMethod=compression.magic;return result;};var generateUnixExternalFileAttr=function(unixPermissions,isDir){var result=unixPermissions;if(!unixPermissions){result=isDir?0x41fd:0x81b4;}
return(result&0xFFFF)<<16;};var generateDosExternalFileAttr=function(dosPermissions,isDir){return(dosPermissions||0)&0x3F;};var generateZipParts=function(name,file,compressedObject,offset,platform){var data=compressedObject.compressedContent,utfEncodedFileName=utils.transformTo("string",utf8.utf8encode(file.name)),comment=file.comment||"",utfEncodedComment=utils.transformTo("string",utf8.utf8encode(comment)),useUTF8ForFileName=utfEncodedFileName.length!==file.name.length,useUTF8ForComment=utfEncodedComment.length!==comment.length,o=file.options,dosTime,dosDate,extraFields="",unicodePathExtraField="",unicodeCommentExtraField="",dir,date;if(file._initialMetadata.dir!==file.dir){dir=file.dir;}else{dir=o.dir;}
if(file._initialMetadata.date!==file.date){date=file.date;}else{date=o.date;}
var extFileAttr=0;var versionMadeBy=0;if(dir){extFileAttr|=0x00010;}
if(platform==="UNIX"){versionMadeBy=0x031E;extFileAttr|=generateUnixExternalFileAttr(file.unixPermissions,dir);}else{versionMadeBy=0x0014;extFileAttr|=generateDosExternalFileAttr(file.dosPermissions,dir);}
dosTime=date.getHours();dosTime=dosTime<<6;dosTime=dosTime|date.getMinutes();dosTime=dosTime<<5;dosTime=dosTime|date.getSeconds()/2;dosDate=date.getFullYear()-1980;dosDate=dosDate<<4;dosDate=dosDate|(date.getMonth()+1);dosDate=dosDate<<5;dosDate=dosDate|date.getDate();if(useUTF8ForFileName){unicodePathExtraField=decToHex(1,1)+
decToHex(crc32(utfEncodedFileName),4)+
utfEncodedFileName;extraFields+="\x75\x70"+
decToHex(unicodePathExtraField.length,2)+
unicodePathExtraField;}
if(useUTF8ForComment){unicodeCommentExtraField=decToHex(1,1)+
decToHex(this.crc32(utfEncodedComment),4)+
utfEncodedComment;extraFields+="\x75\x63"+
decToHex(unicodeCommentExtraField.length,2)+
unicodeCommentExtraField;}
var header="";header+="\x0A\x00";header+=(useUTF8ForFileName||useUTF8ForComment)?"\x00\x08":"\x00\x00";header+=compressedObject.compressionMethod;header+=decToHex(dosTime,2);header+=decToHex(dosDate,2);header+=decToHex(compressedObject.crc32,4);header+=decToHex(compressedObject.compressedSize,4);header+=decToHex(compressedObject.uncompressedSize,4);header+=decToHex(utfEncodedFileName.length,2);header+=decToHex(extraFields.length,2);var fileRecord=signature.LOCAL_FILE_HEADER+header+utfEncodedFileName+extraFields;var dirRecord=signature.CENTRAL_FILE_HEADER+
decToHex(versionMadeBy,2)+
header+
decToHex(utfEncodedComment.length,2)+
"\x00\x00"+
"\x00\x00"+
decToHex(extFileAttr,4)+
decToHex(offset,4)+
utfEncodedFileName+
extraFields+
utfEncodedComment;return{fileRecord:fileRecord,dirRecord:dirRecord,compressedObject:compressedObject};};var out={load:function(stream,options){throw new Error("Load method is not defined. Is the file jszip-load.js included ?");},filter:function(search){var result=[],filename,relativePath,file,fileClone;for(filename in this.files){if(!this.files.hasOwnProperty(filename)){continue;}
file=this.files[filename];fileClone=new ZipObject(file.name,file._data,extend(file.options));relativePath=filename.slice(this.root.length,filename.length);if(filename.slice(0,this.root.length)===this.root&&search(relativePath,fileClone)){result.push(fileClone);}}
return result;},file:function(name,data,o){if(arguments.length===1){if(utils.isRegExp(name)){var regexp=name;return this.filter(function(relativePath,file){return!file.dir&&regexp.test(relativePath);});}
else{return this.filter(function(relativePath,file){return!file.dir&&relativePath===name;})[0]||null;}}
else{name=this.root+name;fileAdd.call(this,name,data,o);}
return this;},folder:function(arg){if(!arg){return this;}
if(utils.isRegExp(arg)){return this.filter(function(relativePath,file){return file.dir&&arg.test(relativePath);});}
var name=this.root+arg;var newFolder=folderAdd.call(this,name);var ret=this.clone();ret.root=newFolder.name;return ret;},remove:function(name){name=this.root+name;var file=this.files[name];if(!file){if(name.slice(-1)!="/"){name+="/";}
file=this.files[name];}
if(file&&!file.dir){delete this.files[name];}else{var kids=this.filter(function(relativePath,file){return file.name.slice(0,name.length)===name;});for(var i=0;i<kids.length;i++){delete this.files[kids[i].name];}}
return this;},generate:function(options){options=extend(options||{},{base64:true,compression:"STORE",compressionOptions:null,type:"base64",platform:"DOS",comment:null,mimeType:'application/zip'});utils.checkSupport(options.type);if(options.platform==='darwin'||options.platform==='freebsd'||options.platform==='linux'||options.platform==='sunos'){options.platform="UNIX";}
if(options.platform==='win32'){options.platform="DOS";}
var zipData=[],localDirLength=0,centralDirLength=0,writer,i,utfEncodedComment=utils.transformTo("string",this.utf8encode(options.comment||this.comment||""));for(var name in this.files){if(!this.files.hasOwnProperty(name)){continue;}
var file=this.files[name];var compressionName=file.options.compression||options.compression.toUpperCase();var compression=compressions[compressionName];if(!compression){throw new Error(compressionName+" is not a valid compression method !");}
var compressionOptions=file.options.compressionOptions||options.compressionOptions||{};var compressedObject=generateCompressedObjectFrom.call(this,file,compression,compressionOptions);var zipPart=generateZipParts.call(this,name,file,compressedObject,localDirLength,options.platform);localDirLength+=zipPart.fileRecord.length+compressedObject.compressedSize;centralDirLength+=zipPart.dirRecord.length;zipData.push(zipPart);}
var dirEnd="";dirEnd=signature.CENTRAL_DIRECTORY_END+
"\x00\x00"+
"\x00\x00"+
decToHex(zipData.length,2)+
decToHex(zipData.length,2)+
decToHex(centralDirLength,4)+
decToHex(localDirLength,4)+
decToHex(utfEncodedComment.length,2)+
utfEncodedComment;var typeName=options.type.toLowerCase();if(typeName==="uint8array"||typeName==="arraybuffer"||typeName==="blob"||typeName==="nodebuffer"){writer=new Uint8ArrayWriter(localDirLength+centralDirLength+dirEnd.length);}else{writer=new StringWriter(localDirLength+centralDirLength+dirEnd.length);}
for(i=0;i<zipData.length;i++){writer.append(zipData[i].fileRecord);writer.append(zipData[i].compressedObject.compressedContent);}
for(i=0;i<zipData.length;i++){writer.append(zipData[i].dirRecord);}
writer.append(dirEnd);var zip=writer.finalize();switch(options.type.toLowerCase()){case "uint8array":case "arraybuffer":case "nodebuffer":return utils.transformTo(options.type.toLowerCase(),zip);case "blob":return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer",zip),options.mimeType);case "base64":return(options.base64)?base64.encode(zip):zip;default:return zip;}},crc32:function(input,crc){return crc32(input,crc);},utf8encode:function(string){return utils.transformTo("string",utf8.utf8encode(string));},utf8decode:function(input){return utf8.utf8decode(input);}};module.exports=out;},{"./base64":84,"./compressedObject":85,"./compressions":86,"./crc32":87,"./defaults":89,"./nodeBuffer":94,"./signature":97,"./stringWriter":99,"./support":100,"./uint8ArrayWriter":102,"./utf8":103,"./utils":104}],97:[function(require,module,exports){'use strict';exports.LOCAL_FILE_HEADER="PK\x03\x04";exports.CENTRAL_FILE_HEADER="PK\x01\x02";exports.CENTRAL_DIRECTORY_END="PK\x05\x06";exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK\x06\x07";exports.ZIP64_CENTRAL_DIRECTORY_END="PK\x06\x06";exports.DATA_DESCRIPTOR="PK\x07\x08";},{}],98:[function(require,module,exports){'use strict';var DataReader=require('./dataReader');var utils=require('./utils');function StringReader(data,optimizedBinaryString){this.data=data;if(!optimizedBinaryString){this.data=utils.string2binary(this.data);}
this.length=this.data.length;this.index=0;}
StringReader.prototype=new DataReader();StringReader.prototype.byteAt=function(i){return this.data.charCodeAt(i);};StringReader.prototype.lastIndexOfSignature=function(sig){return this.data.lastIndexOf(sig);};StringReader.prototype.readData=function(size){this.checkOffset(size);var result=this.data.slice(this.index,this.index+size);this.index+=size;return result;};module.exports=StringReader;},{"./dataReader":88,"./utils":104}],99:[function(require,module,exports){'use strict';var utils=require('./utils');var StringWriter=function(){this.data=[];};StringWriter.prototype={append:function(input){input=utils.transformTo("string",input);this.data.push(input);},finalize:function(){return this.data.join("");}};module.exports=StringWriter;},{"./utils":104}],100:[function(require,module,exports){(function(Buffer){'use strict';exports.base64=true;exports.array=true;exports.string=true;exports.arraybuffer=typeof ArrayBuffer!=="undefined"&&typeof Uint8Array!=="undefined";exports.nodebuffer=typeof Buffer!=="undefined";exports.uint8array=typeof Uint8Array!=="undefined";if(typeof ArrayBuffer==="undefined"){exports.blob=false;}
else{var buffer=new ArrayBuffer(0);try{exports.blob=new Blob([buffer],{type:"application/zip"}).size===0;}
catch(e){try{var Builder=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder;var builder=new Builder();builder.append(buffer);exports.blob=builder.getBlob('application/zip').size===0;}
catch(e){exports.blob=false;}}}}).call(this,require("buffer").Buffer)},{"buffer":77}],101:[function(require,module,exports){'use strict';var DataReader=require('./dataReader');function Uint8ArrayReader(data){if(data){this.data=data;this.length=this.data.length;this.index=0;}}
Uint8ArrayReader.prototype=new DataReader();Uint8ArrayReader.prototype.byteAt=function(i){return this.data[i];};Uint8ArrayReader.prototype.lastIndexOfSignature=function(sig){var sig0=sig.charCodeAt(0),sig1=sig.charCodeAt(1),sig2=sig.charCodeAt(2),sig3=sig.charCodeAt(3);for(var i=this.length-4;i>=0;--i){if(this.data[i]===sig0&&this.data[i+1]===sig1&&this.data[i+2]===sig2&&this.data[i+3]===sig3){return i;}}
return-1;};Uint8ArrayReader.prototype.readData=function(size){this.checkOffset(size);if(size===0){return new Uint8Array(0);}
var result=this.data.subarray(this.index,this.index+size);this.index+=size;return result;};module.exports=Uint8ArrayReader;},{"./dataReader":88}],102:[function(require,module,exports){'use strict';var utils=require('./utils');var Uint8ArrayWriter=function(length){this.data=new Uint8Array(length);this.index=0;};Uint8ArrayWriter.prototype={append:function(input){if(input.length!==0){input=utils.transformTo("uint8array",input);this.data.set(input,this.index);this.index+=input.length;}},finalize:function(){return this.data;}};module.exports=Uint8ArrayWriter;},{"./utils":104}],103:[function(require,module,exports){'use strict';var utils=require('./utils');var support=require('./support');var nodeBuffer=require('./nodeBuffer');var _utf8len=new Array(256);for(var i=0;i<256;i++){_utf8len[i]=(i>=252?6:i>=248?5:i>=240?4:i>=224?3:i>=192?2:1);}
_utf8len[254]=_utf8len[254]=1;var string2buf=function(str){var buf,c,c2,m_pos,i,str_len=str.length,buf_len=0;for(m_pos=0;m_pos<str_len;m_pos++){c=str.charCodeAt(m_pos);if((c&0xfc00)===0xd800&&(m_pos+1<str_len)){c2=str.charCodeAt(m_pos+1);if((c2&0xfc00)===0xdc00){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);m_pos++;}}
buf_len+=c<0x80?1:c<0x800?2:c<0x10000?3:4;}
if(support.uint8array){buf=new Uint8Array(buf_len);}else{buf=new Array(buf_len);}
for(i=0,m_pos=0;i<buf_len;m_pos++){c=str.charCodeAt(m_pos);if((c&0xfc00)===0xd800&&(m_pos+1<str_len)){c2=str.charCodeAt(m_pos+1);if((c2&0xfc00)===0xdc00){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);m_pos++;}}
if(c<0x80){buf[i++]=c;}else if(c<0x800){buf[i++]=0xC0|(c>>>6);buf[i++]=0x80|(c&0x3f);}else if(c<0x10000){buf[i++]=0xE0|(c>>>12);buf[i++]=0x80|(c>>>6&0x3f);buf[i++]=0x80|(c&0x3f);}else{buf[i++]=0xf0|(c>>>18);buf[i++]=0x80|(c>>>12&0x3f);buf[i++]=0x80|(c>>>6&0x3f);buf[i++]=0x80|(c&0x3f);}}
return buf;};var utf8border=function(buf,max){var pos;max=max||buf.length;if(max>buf.length){max=buf.length;}
pos=max-1;while(pos>=0&&(buf[pos]&0xC0)===0x80){pos--;}
if(pos<0){return max;}
if(pos===0){return max;}
return(pos+_utf8len[buf[pos]]>max)?pos:max;};var buf2string=function(buf){var str,i,out,c,c_len;var len=buf.length;var utf16buf=new Array(len*2);for(out=0,i=0;i<len;){c=buf[i++];if(c<0x80){utf16buf[out++]=c;continue;}
c_len=_utf8len[c];if(c_len>4){utf16buf[out++]=0xfffd;i+=c_len-1;continue;}
c&=c_len===2?0x1f:c_len===3?0x0f:0x07;while(c_len>1&&i<len){c=(c<<6)|(buf[i++]&0x3f);c_len--;}
if(c_len>1){utf16buf[out++]=0xfffd;continue;}
if(c<0x10000){utf16buf[out++]=c;}else{c-=0x10000;utf16buf[out++]=0xd800|((c>>10)&0x3ff);utf16buf[out++]=0xdc00|(c&0x3ff);}}
if(utf16buf.length!==out){if(utf16buf.subarray){utf16buf=utf16buf.subarray(0,out);}else{utf16buf.length=out;}}
return utils.applyFromCharCode(utf16buf);};exports.utf8encode=function utf8encode(str){if(support.nodebuffer){return nodeBuffer(str,"utf-8");}
return string2buf(str);};exports.utf8decode=function utf8decode(buf){if(support.nodebuffer){return utils.transformTo("nodebuffer",buf).toString("utf-8");}
buf=utils.transformTo(support.uint8array?"uint8array":"array",buf);var result=[],k=0,len=buf.length,chunk=65536;while(k<len){var nextBoundary=utf8border(buf,Math.min(k+chunk,len));if(support.uint8array){result.push(buf2string(buf.subarray(k,nextBoundary)));}else{result.push(buf2string(buf.slice(k,nextBoundary)));}
k=nextBoundary;}
return result.join("");};},{"./nodeBuffer":94,"./support":100,"./utils":104}],104:[function(require,module,exports){'use strict';var support=require('./support');var compressions=require('./compressions');var nodeBuffer=require('./nodeBuffer');exports.string2binary=function(str){var result="";for(var i=0;i<str.length;i++){result+=String.fromCharCode(str.charCodeAt(i)&0xff);}
return result;};exports.arrayBuffer2Blob=function(buffer,mimeType){exports.checkSupport("blob");mimeType=mimeType||'application/zip';try{return new Blob([buffer],{type:mimeType});}
catch(e){try{var Builder=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder;var builder=new Builder();builder.append(buffer);return builder.getBlob(mimeType);}
catch(e){throw new Error("Bug : can't construct the Blob.");}}};function identity(input){return input;}
function stringToArrayLike(str,array){for(var i=0;i<str.length;++i){array[i]=str.charCodeAt(i)&0xFF;}
return array;}
function arrayLikeToString(array){var chunk=65536;var result=[],len=array.length,type=exports.getTypeOf(array),k=0,canUseApply=true;try{switch(type){case "uint8array":String.fromCharCode.apply(null,new Uint8Array(0));break;case "nodebuffer":String.fromCharCode.apply(null,nodeBuffer(0));break;}}catch(e){canUseApply=false;}
if(!canUseApply){var resultStr="";for(var i=0;i<array.length;i++){resultStr+=String.fromCharCode(array[i]);}
return resultStr;}
while(k<len&&chunk>1){try{if(type==="array"||type==="nodebuffer"){result.push(String.fromCharCode.apply(null,array.slice(k,Math.min(k+chunk,len))));}
else{result.push(String.fromCharCode.apply(null,array.subarray(k,Math.min(k+chunk,len))));}
k+=chunk;}
catch(e){chunk=Math.floor(chunk/2);}}
return result.join("");}
exports.applyFromCharCode=arrayLikeToString;function arrayLikeToArrayLike(arrayFrom,arrayTo){for(var i=0;i<arrayFrom.length;i++){arrayTo[i]=arrayFrom[i];}
return arrayTo;}
var transform={};transform["string"]={"string":identity,"array":function(input){return stringToArrayLike(input,new Array(input.length));},"arraybuffer":function(input){return transform["string"]["uint8array"](input).buffer;},"uint8array":function(input){return stringToArrayLike(input,new Uint8Array(input.length));},"nodebuffer":function(input){return stringToArrayLike(input,nodeBuffer(input.length));}};transform["array"]={"string":arrayLikeToString,"array":identity,"arraybuffer":function(input){return(new Uint8Array(input)).buffer;},"uint8array":function(input){return new Uint8Array(input);},"nodebuffer":function(input){return nodeBuffer(input);}};transform["arraybuffer"]={"string":function(input){return arrayLikeToString(new Uint8Array(input));},"array":function(input){return arrayLikeToArrayLike(new Uint8Array(input),new Array(input.byteLength));},"arraybuffer":identity,"uint8array":function(input){return new Uint8Array(input);},"nodebuffer":function(input){return nodeBuffer(new Uint8Array(input));}};transform["uint8array"]={"string":arrayLikeToString,"array":function(input){return arrayLikeToArrayLike(input,new Array(input.length));},"arraybuffer":function(input){return input.buffer;},"uint8array":identity,"nodebuffer":function(input){return nodeBuffer(input);}};transform["nodebuffer"]={"string":arrayLikeToString,"array":function(input){return arrayLikeToArrayLike(input,new Array(input.length));},"arraybuffer":function(input){return transform["nodebuffer"]["uint8array"](input).buffer;},"uint8array":function(input){return arrayLikeToArrayLike(input,new Uint8Array(input.length));},"nodebuffer":identity};exports.transformTo=function(outputType,input){if(!input){input="";}
if(!outputType){return input;}
exports.checkSupport(outputType);var inputType=exports.getTypeOf(input);var result=transform[inputType][outputType](input);return result;};exports.getTypeOf=function(input){if(typeof input==="string"){return "string";}
if(Object.prototype.toString.call(input)==="[object Array]"){return "array";}
if(support.nodebuffer&&nodeBuffer.test(input)){return "nodebuffer";}
if(support.uint8array&&input instanceof Uint8Array){return "uint8array";}
if(support.arraybuffer&&input instanceof ArrayBuffer){return "arraybuffer";}};exports.checkSupport=function(type){var supported=support[type.toLowerCase()];if(!supported){throw new Error(type+" is not supported by this browser");}};exports.MAX_VALUE_16BITS=65535;exports.MAX_VALUE_32BITS=-1;exports.pretty=function(str){var res='',code,i;for(i=0;i<(str||"").length;i++){code=str.charCodeAt(i);res+='\\x'+(code<16?"0":"")+code.toString(16).toUpperCase();}
return res;};exports.findCompression=function(compressionMethod){for(var method in compressions){if(!compressions.hasOwnProperty(method)){continue;}
if(compressions[method].magic===compressionMethod){return compressions[method];}}
return null;};exports.isRegExp=function(object){return Object.prototype.toString.call(object)==="[object RegExp]";};},{"./compressions":86,"./nodeBuffer":94,"./support":100}],105:[function(require,module,exports){'use strict';var StringReader=require('./stringReader');var NodeBufferReader=require('./nodeBufferReader');var Uint8ArrayReader=require('./uint8ArrayReader');var utils=require('./utils');var sig=require('./signature');var ZipEntry=require('./zipEntry');var support=require('./support');var jszipProto=require('./object');function ZipEntries(data,loadOptions){this.files=[];this.loadOptions=loadOptions;if(data){this.load(data);}}
ZipEntries.prototype={checkSignature:function(expectedSignature){var signature=this.reader.readString(4);if(signature!==expectedSignature){throw new Error("Corrupted zip or bug : unexpected signature "+"("+utils.pretty(signature)+", expected "+utils.pretty(expectedSignature)+")");}},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2);this.diskWithCentralDirStart=this.reader.readInt(2);this.centralDirRecordsOnThisDisk=this.reader.readInt(2);this.centralDirRecords=this.reader.readInt(2);this.centralDirSize=this.reader.readInt(4);this.centralDirOffset=this.reader.readInt(4);this.zipCommentLength=this.reader.readInt(2);this.zipComment=this.reader.readString(this.zipCommentLength);this.zipComment=jszipProto.utf8decode(this.zipComment);},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8);this.versionMadeBy=this.reader.readString(2);this.versionNeeded=this.reader.readInt(2);this.diskNumber=this.reader.readInt(4);this.diskWithCentralDirStart=this.reader.readInt(4);this.centralDirRecordsOnThisDisk=this.reader.readInt(8);this.centralDirRecords=this.reader.readInt(8);this.centralDirSize=this.reader.readInt(8);this.centralDirOffset=this.reader.readInt(8);this.zip64ExtensibleData={};var extraDataSize=this.zip64EndOfCentralSize-44,index=0,extraFieldId,extraFieldLength,extraFieldValue;while(index<extraDataSize){extraFieldId=this.reader.readInt(2);extraFieldLength=this.reader.readInt(4);extraFieldValue=this.reader.readString(extraFieldLength);this.zip64ExtensibleData[extraFieldId]={id:extraFieldId,length:extraFieldLength,value:extraFieldValue};}},readBlockZip64EndOfCentralLocator:function(){this.diskWithZip64CentralDirStart=this.reader.readInt(4);this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8);this.disksCount=this.reader.readInt(4);if(this.disksCount>1){throw new Error("Multi-volumes zip are not supported");}},readLocalFiles:function(){var i,file;for(i=0;i<this.files.length;i++){file=this.files[i];this.reader.setIndex(file.localHeaderOffset);this.checkSignature(sig.LOCAL_FILE_HEADER);file.readLocalPart(this.reader);file.handleUTF8();file.processAttributes();}},readCentralDir:function(){var file;this.reader.setIndex(this.centralDirOffset);while(this.reader.readString(4)===sig.CENTRAL_FILE_HEADER){file=new ZipEntry({zip64:this.zip64},this.loadOptions);file.readCentralPart(this.reader);this.files.push(file);}},readEndOfCentral:function(){var offset=this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);if(offset===-1){var isGarbage=true;try{this.reader.setIndex(0);this.checkSignature(sig.LOCAL_FILE_HEADER);isGarbage=false;}catch(e){}
if(isGarbage){throw new Error("Can't find end of central directory : is this a zip file ? "+
"If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html");}else{throw new Error("Corrupted zip : can't find end of central directory");}}
this.reader.setIndex(offset);this.checkSignature(sig.CENTRAL_DIRECTORY_END);this.readBlockEndOfCentral();if(this.diskNumber===utils.MAX_VALUE_16BITS||this.diskWithCentralDirStart===utils.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===utils.MAX_VALUE_16BITS||this.centralDirRecords===utils.MAX_VALUE_16BITS||this.centralDirSize===utils.MAX_VALUE_32BITS||this.centralDirOffset===utils.MAX_VALUE_32BITS){this.zip64=true;offset=this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);if(offset===-1){throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");}
this.reader.setIndex(offset);this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);this.readBlockZip64EndOfCentralLocator();this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);this.readBlockZip64EndOfCentral();}},prepareReader:function(data){var type=utils.getTypeOf(data);if(type==="string"&&!support.uint8array){this.reader=new StringReader(data,this.loadOptions.optimizedBinaryString);}
else if(type==="nodebuffer"){this.reader=new NodeBufferReader(data);}
else{this.reader=new Uint8ArrayReader(utils.transformTo("uint8array",data));}},load:function(data){this.prepareReader(data);this.readEndOfCentral();this.readCentralDir();this.readLocalFiles();}};module.exports=ZipEntries;},{"./nodeBufferReader":95,"./object":96,"./signature":97,"./stringReader":98,"./support":100,"./uint8ArrayReader":101,"./utils":104,"./zipEntry":106}],106:[function(require,module,exports){'use strict';var StringReader=require('./stringReader');var utils=require('./utils');var CompressedObject=require('./compressedObject');var jszipProto=require('./object');var MADE_BY_DOS=0x00;var MADE_BY_UNIX=0x03;function ZipEntry(options,loadOptions){this.options=options;this.loadOptions=loadOptions;}
ZipEntry.prototype={isEncrypted:function(){return(this.bitFlag&0x0001)===0x0001;},useUTF8:function(){return(this.bitFlag&0x0800)===0x0800;},prepareCompressedContent:function(reader,from,length){return function(){var previousIndex=reader.index;reader.setIndex(from);var compressedFileData=reader.readData(length);reader.setIndex(previousIndex);return compressedFileData;};},prepareContent:function(reader,from,length,compression,uncompressedSize){return function(){var compressedFileData=utils.transformTo(compression.uncompressInputType,this.getCompressedContent());var uncompressedFileData=compression.uncompress(compressedFileData);if(uncompressedFileData.length!==uncompressedSize){throw new Error("Bug : uncompressed data size mismatch");}
return uncompressedFileData;};},readLocalPart:function(reader){var compression,localExtraFieldsLength;reader.skip(22);this.fileNameLength=reader.readInt(2);localExtraFieldsLength=reader.readInt(2);this.fileName=reader.readString(this.fileNameLength);reader.skip(localExtraFieldsLength);if(this.compressedSize==-1||this.uncompressedSize==-1){throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory "+"(compressedSize == -1 || uncompressedSize == -1)");}
compression=utils.findCompression(this.compressionMethod);if(compression===null){throw new Error("Corrupted zip : compression "+utils.pretty(this.compressionMethod)+" unknown (inner file : "+this.fileName+")");}
this.decompressed=new CompressedObject();this.decompressed.compressedSize=this.compressedSize;this.decompressed.uncompressedSize=this.uncompressedSize;this.decompressed.crc32=this.crc32;this.decompressed.compressionMethod=this.compressionMethod;this.decompressed.getCompressedContent=this.prepareCompressedContent(reader,reader.index,this.compressedSize,compression);this.decompressed.getContent=this.prepareContent(reader,reader.index,this.compressedSize,compression,this.uncompressedSize);if(this.loadOptions.checkCRC32){this.decompressed=utils.transformTo("string",this.decompressed.getContent());if(jszipProto.crc32(this.decompressed)!==this.crc32){throw new Error("Corrupted zip : CRC32 mismatch");}}},readCentralPart:function(reader){this.versionMadeBy=reader.readInt(2);this.versionNeeded=reader.readInt(2);this.bitFlag=reader.readInt(2);this.compressionMethod=reader.readString(2);this.date=reader.readDate();this.crc32=reader.readInt(4);this.compressedSize=reader.readInt(4);this.uncompressedSize=reader.readInt(4);this.fileNameLength=reader.readInt(2);this.extraFieldsLength=reader.readInt(2);this.fileCommentLength=reader.readInt(2);this.diskNumberStart=reader.readInt(2);this.internalFileAttributes=reader.readInt(2);this.externalFileAttributes=reader.readInt(4);this.localHeaderOffset=reader.readInt(4);if(this.isEncrypted()){throw new Error("Encrypted zip are not supported");}
this.fileName=reader.readString(this.fileNameLength);this.readExtraFields(reader);this.parseZIP64ExtraField(reader);this.fileComment=reader.readString(this.fileCommentLength);},processAttributes:function(){this.unixPermissions=null;this.dosPermissions=null;var madeBy=this.versionMadeBy>>8;this.dir=this.externalFileAttributes&0x0010?true:false;if(madeBy===MADE_BY_DOS){this.dosPermissions=this.externalFileAttributes&0x3F;}
if(madeBy===MADE_BY_UNIX){this.unixPermissions=(this.externalFileAttributes>>16)&0xFFFF;}
if(!this.dir&&this.fileName.slice(-1)==='/'){this.dir=true;}},parseZIP64ExtraField:function(reader){if(!this.extraFields[0x0001]){return;}
var extraReader=new StringReader(this.extraFields[0x0001].value);if(this.uncompressedSize===utils.MAX_VALUE_32BITS){this.uncompressedSize=extraReader.readInt(8);}
if(this.compressedSize===utils.MAX_VALUE_32BITS){this.compressedSize=extraReader.readInt(8);}
if(this.localHeaderOffset===utils.MAX_VALUE_32BITS){this.localHeaderOffset=extraReader.readInt(8);}
if(this.diskNumberStart===utils.MAX_VALUE_32BITS){this.diskNumberStart=extraReader.readInt(4);}},readExtraFields:function(reader){var start=reader.index,extraFieldId,extraFieldLength,extraFieldValue;this.extraFields=this.extraFields||{};while(reader.index<start+this.extraFieldsLength){extraFieldId=reader.readInt(2);extraFieldLength=reader.readInt(2);extraFieldValue=reader.readString(extraFieldLength);this.extraFields[extraFieldId]={id:extraFieldId,length:extraFieldLength,value:extraFieldValue};}},handleUTF8:function(){if(this.useUTF8()){this.fileName=jszipProto.utf8decode(this.fileName);this.fileComment=jszipProto.utf8decode(this.fileComment);}else{var upath=this.findExtraFieldUnicodePath();if(upath!==null){this.fileName=upath;}
var ucomment=this.findExtraFieldUnicodeComment();if(ucomment!==null){this.fileComment=ucomment;}}},findExtraFieldUnicodePath:function(){var upathField=this.extraFields[0x7075];if(upathField){var extraReader=new StringReader(upathField.value);if(extraReader.readInt(1)!==1){return null;}
if(jszipProto.crc32(this.fileName)!==extraReader.readInt(4)){return null;}
return jszipProto.utf8decode(extraReader.readString(upathField.length-5));}
return null;},findExtraFieldUnicodeComment:function(){var ucommentField=this.extraFields[0x6375];if(ucommentField){var extraReader=new StringReader(ucommentField.value);if(extraReader.readInt(1)!==1){return null;}
if(jszipProto.crc32(this.fileComment)!==extraReader.readInt(4)){return null;}
return jszipProto.utf8decode(extraReader.readString(ucommentField.length-5));}
return null;}};module.exports=ZipEntry;},{"./compressedObject":85,"./object":96,"./stringReader":98,"./utils":104}],107:[function(require,module,exports){exports.Parser=require("./lib/parser").Parser;exports.rules=require("./lib/rules");exports.errors=require("./lib/errors");exports.results=require("./lib/parsing-results");exports.StringSource=require("./lib/StringSource");exports.Token=require("./lib/Token");exports.bottomUp=require("./lib/bottom-up");exports.RegexTokeniser=require("./lib/regex-tokeniser").RegexTokeniser;exports.rule=function(ruleBuilder){var rule;return function(input){if(!rule){rule=ruleBuilder();}
return rule(input);};};},{"./lib/StringSource":108,"./lib/Token":109,"./lib/bottom-up":111,"./lib/errors":112,"./lib/parser":114,"./lib/parsing-results":115,"./lib/regex-tokeniser":116,"./lib/rules":117}],108:[function(require,module,exports){var util=require("util");var StringSource=module.exports=function(string,description){var self={asString:function(){return string;},range:function(startIndex,endIndex){return new StringSourceRange(string,description,startIndex,endIndex);}};return self;};var StringSourceRange=function(string,description,startIndex,endIndex){this._string=string;this._description=description;this._startIndex=startIndex;this._endIndex=endIndex;};StringSourceRange.prototype.to=function(otherRange){return new StringSourceRange(this._string,this._description,this._startIndex,otherRange._endIndex);};StringSourceRange.prototype.describe=function(){var position=this._position();var description=this._description?this._description+"\n":"";return util.format("%sLine number: %s\nCharacter number: %s",description,position.lineNumber,position.characterNumber);};StringSourceRange.prototype.lineNumber=function(){return this._position().lineNumber;};StringSourceRange.prototype.characterNumber=function(){return this._position().characterNumber;};StringSourceRange.prototype._position=function(){var self=this;var index=0;var nextNewLine=function(){return self._string.indexOf("\n",index);};var lineNumber=1;while(nextNewLine()!==-1&&nextNewLine()<this._startIndex){index=nextNewLine()+1;lineNumber+=1;}
var characterNumber=this._startIndex-index+1;return{lineNumber:lineNumber,characterNumber:characterNumber};};},{"util":157}],109:[function(require,module,exports){module.exports=function(name,value,source){this.name=name;this.value=value;if(source){this.source=source;}};},{}],110:[function(require,module,exports){var TokenIterator=module.exports=function(tokens,startIndex){this._tokens=tokens;this._startIndex=startIndex||0;};TokenIterator.prototype.head=function(){return this._tokens[this._startIndex];};TokenIterator.prototype.tail=function(startIndex){return new TokenIterator(this._tokens,this._startIndex+1);};TokenIterator.prototype.toArray=function(){return this._tokens.slice(this._startIndex);};TokenIterator.prototype.end=function(){return this._tokens[this._tokens.length-1];};TokenIterator.prototype.to=function(end){var start=this.head().source;var endToken=end.head()||end.end();return start.to(endToken.source);};},{}],111:[function(require,module,exports){var rules=require("./rules");var results=require("./parsing-results");exports.parser=function(name,prefixRules,infixRuleBuilders){var self={rule:rule,leftAssociative:leftAssociative,rightAssociative:rightAssociative};var infixRules=new InfixRules(infixRuleBuilders.map(createInfixRule));var prefixRule=rules.firstOf(name,prefixRules);function createInfixRule(infixRuleBuilder){return{name:infixRuleBuilder.name,rule:lazyRule(infixRuleBuilder.ruleBuilder.bind(null,self))};}
function rule(){return createRule(infixRules);}
function leftAssociative(name){return createRule(infixRules.untilExclusive(name));}
function rightAssociative(name){return createRule(infixRules.untilInclusive(name));}
function createRule(infixRules){return apply.bind(null,infixRules);}
function apply(infixRules,tokens){var leftResult=prefixRule(tokens);if(leftResult.isSuccess()){return infixRules.apply(leftResult);}else{return leftResult;}}
return self;};function InfixRules(infixRules){function untilExclusive(name){return new InfixRules(infixRules.slice(0,ruleNames().indexOf(name)));}
function untilInclusive(name){return new InfixRules(infixRules.slice(0,ruleNames().indexOf(name)+1));}
function ruleNames(){return infixRules.map(function(rule){return rule.name;});}
function apply(leftResult){var currentResult;var source;while(true){currentResult=applyToTokens(leftResult.remaining());if(currentResult.isSuccess()){source=leftResult.source().to(currentResult.source());leftResult=results.success(currentResult.value()(leftResult.value(),source),currentResult.remaining(),source)}else if(currentResult.isFailure()){return leftResult;}else{return currentResult;}}}
function applyToTokens(tokens){return rules.firstOf("infix",infixRules.map(function(infix){return infix.rule;}))(tokens);}
return{apply:apply,untilExclusive:untilExclusive,untilInclusive:untilInclusive}}
exports.infix=function(name,ruleBuilder){function map(func){return exports.infix(name,function(parser){var rule=ruleBuilder(parser);return function(tokens){var result=rule(tokens);return result.map(function(right){return function(left,source){return func(left,right,source);};});};});}
return{name:name,ruleBuilder:ruleBuilder,map:map};}
var lazyRule=function(ruleBuilder){var rule;return function(input){if(!rule){rule=ruleBuilder();}
return rule(input);};};},{"./parsing-results":115,"./rules":117}],112:[function(require,module,exports){exports.error=function(options){return new Error(options);};var Error=function(options){this.expected=options.expected;this.actual=options.actual;this._location=options.location;};Error.prototype.describe=function(){var locationDescription=this._location?this._location.describe()+":\n":"";return locationDescription+"Expected "+this.expected+"\nbut got "+this.actual;};Error.prototype.lineNumber=function(){return this._location.lineNumber();};Error.prototype.characterNumber=function(){return this._location.characterNumber();};},{}],113:[function(require,module,exports){var fromArray=exports.fromArray=function(array){var index=0;var hasNext=function(){return index<array.length;};return new LazyIterator({hasNext:hasNext,next:function(){if(!hasNext()){throw new Error("No more elements");}else{return array[index++];}}});};var LazyIterator=function(iterator){this._iterator=iterator;};LazyIterator.prototype.map=function(func){var iterator=this._iterator;return new LazyIterator({hasNext:function(){return iterator.hasNext();},next:function(){return func(iterator.next());}});};LazyIterator.prototype.filter=function(condition){var iterator=this._iterator;var moved=false;var hasNext=false;var next;var moveIfNecessary=function(){if(moved){return;}
moved=true;hasNext=false;while(iterator.hasNext()&&!hasNext){next=iterator.next();hasNext=condition(next);}};return new LazyIterator({hasNext:function(){moveIfNecessary();return hasNext;},next:function(){moveIfNecessary();var toReturn=next;moved=false;return toReturn;}});};LazyIterator.prototype.first=function(){var iterator=this._iterator;if(this._iterator.hasNext()){return iterator.next();}else{return null;}};LazyIterator.prototype.toArray=function(){var result=[];while(this._iterator.hasNext()){result.push(this._iterator.next());}
return result;};},{}],114:[function(require,module,exports){var TokenIterator=require("./TokenIterator");exports.Parser=function(options){var parseTokens=function(parser,tokens){return parser(new TokenIterator(tokens));};return{parseTokens:parseTokens};};},{"./TokenIterator":110}],115:[function(require,module,exports){module.exports={failure:function(errors,remaining){if(errors.length<1){throw new Error("Failure must have errors");}
return new Result({status:"failure",remaining:remaining,errors:errors});},error:function(errors,remaining){if(errors.length<1){throw new Error("Failure must have errors");}
return new Result({status:"error",remaining:remaining,errors:errors});},success:function(value,remaining,source){return new Result({status:"success",value:value,source:source,remaining:remaining,errors:[]});},cut:function(remaining){return new Result({status:"cut",remaining:remaining,errors:[]});}};var Result=function(options){this._value=options.value;this._status=options.status;this._hasValue=options.value!==undefined;this._remaining=options.remaining;this._source=options.source;this._errors=options.errors;};Result.prototype.map=function(func){if(this._hasValue){return new Result({value:func(this._value,this._source),status:this._status,remaining:this._remaining,source:this._source,errors:this._errors});}else{return this;}};Result.prototype.changeRemaining=function(remaining){return new Result({value:this._value,status:this._status,remaining:remaining,source:this._source,errors:this._errors});};Result.prototype.isSuccess=function(){return this._status==="success"||this._status==="cut";};Result.prototype.isFailure=function(){return this._status==="failure";};Result.prototype.isError=function(){return this._status==="error";};Result.prototype.isCut=function(){return this._status==="cut";};Result.prototype.value=function(){return this._value;};Result.prototype.remaining=function(){return this._remaining;};Result.prototype.source=function(){return this._source;};Result.prototype.errors=function(){return this._errors;};},{}],116:[function(require,module,exports){var Token=require("./Token");var StringSource=require("./StringSource");exports.RegexTokeniser=RegexTokeniser;function RegexTokeniser(rules){rules=rules.map(function(rule){return{name:rule.name,regex:new RegExp(rule.regex.source,"g")};});function tokenise(input,description){var source=new StringSource(input,description);var index=0;var tokens=[];while(index<input.length){var result=readNextToken(input,index,source);index=result.endIndex;tokens.push(result.token);}
tokens.push(endToken(input,source));return tokens;}
function readNextToken(string,startIndex,source){for(var i=0;i<rules.length;i++){var regex=rules[i].regex;regex.lastIndex=startIndex;var result=regex.exec(string);if(result){var endIndex=startIndex+result[0].length;if(result.index===startIndex&&endIndex>startIndex){var value=result[1];var token=new Token(rules[i].name,value,source.range(startIndex,endIndex));return{token:token,endIndex:endIndex};}}}
var endIndex=startIndex+1;var token=new Token("unrecognisedCharacter",string.substring(startIndex,endIndex),source.range(startIndex,endIndex));return{token:token,endIndex:endIndex};}
function endToken(input,source){return new Token("end",null,source.range(input.length,input.length));}
return{tokenise:tokenise}}},{"./StringSource":108,"./Token":109}],117:[function(require,module,exports){var _=require("underscore");var options=require("option");var results=require("./parsing-results");var errors=require("./errors");var lazyIterators=require("./lazy-iterators");exports.token=function(tokenType,value){var matchValue=value!==undefined;return function(input){var token=input.head();if(token&&token.name===tokenType&&(!matchValue||token.value===value)){return results.success(token.value,input.tail(),token.source);}else{var expected=describeToken({name:tokenType,value:value});return describeTokenMismatch(input,expected);}};};exports.tokenOfType=function(tokenType){return exports.token(tokenType);};exports.firstOf=function(name,parsers){if(!_.isArray(parsers)){parsers=Array.prototype.slice.call(arguments,1);}
return function(input){return lazyIterators.fromArray(parsers).map(function(parser){return parser(input);}).filter(function(result){return result.isSuccess()||result.isError();}).first()||describeTokenMismatch(input,name);};};exports.then=function(parser,func){return function(input){var result=parser(input);if(!result.map){console.log(result);}
return result.map(func);};};exports.sequence=function(){var parsers=Array.prototype.slice.call(arguments,0);var rule=function(input){var result=_.foldl(parsers,function(memo,parser){var result=memo.result;var hasCut=memo.hasCut;if(!result.isSuccess()){return{result:result,hasCut:hasCut};}
var subResult=parser(result.remaining());if(subResult.isCut()){return{result:result,hasCut:true};}else if(subResult.isSuccess()){var values;if(parser.isCaptured){values=result.value().withValue(parser,subResult.value());}else{values=result.value();}
var remaining=subResult.remaining();var source=input.to(remaining);return{result:results.success(values,remaining,source),hasCut:hasCut};}else if(hasCut){return{result:results.error(subResult.errors(),subResult.remaining()),hasCut:hasCut};}else{return{result:subResult,hasCut:hasCut};}},{result:results.success(new SequenceValues(),input),hasCut:false}).result;var source=input.to(result.remaining());return result.map(function(values){return values.withValue(exports.sequence.source,source);});};rule.head=function(){var firstCapture=_.find(parsers,isCapturedRule);return exports.then(rule,exports.sequence.extract(firstCapture));};rule.map=function(func){return exports.then(rule,function(result){return func.apply(this,result.toArray());});};function isCapturedRule(subRule){return subRule.isCaptured;}
return rule;};var SequenceValues=function(values,valuesArray){this._values=values||{};this._valuesArray=valuesArray||[];};SequenceValues.prototype.withValue=function(rule,value){if(rule.captureName&&rule.captureName in this._values){throw new Error("Cannot add second value for capture \""+rule.captureName+"\"");}else{var newValues=_.clone(this._values);newValues[rule.captureName]=value;var newValuesArray=this._valuesArray.concat([value]);return new SequenceValues(newValues,newValuesArray);}};SequenceValues.prototype.get=function(rule){if(rule.captureName in this._values){return this._values[rule.captureName];}else{throw new Error("No value for capture \""+rule.captureName+"\"");}};SequenceValues.prototype.toArray=function(){return this._valuesArray;};exports.sequence.capture=function(rule,name){var captureRule=function(){return rule.apply(this,arguments);};captureRule.captureName=name;captureRule.isCaptured=true;return captureRule;};exports.sequence.extract=function(rule){return function(result){return result.get(rule);};};exports.sequence.applyValues=function(func){var rules=Array.prototype.slice.call(arguments,1);return function(result){var values=rules.map(function(rule){return result.get(rule);});return func.apply(this,values);};};exports.sequence.source={captureName:"☃source☃"};exports.sequence.cut=function(){return function(input){return results.cut(input);};};exports.optional=function(rule){return function(input){var result=rule(input);if(result.isSuccess()){return result.map(options.some);}else if(result.isFailure()){return results.success(options.none,input);}else{return result;}};};exports.zeroOrMoreWithSeparator=function(rule,separator){return repeatedWithSeparator(rule,separator,false);};exports.oneOrMoreWithSeparator=function(rule,separator){return repeatedWithSeparator(rule,separator,true);};var zeroOrMore=exports.zeroOrMore=function(rule){return function(input){var values=[];var result;while((result=rule(input))&&result.isSuccess()){input=result.remaining();values.push(result.value());}
if(result.isError()){return result;}else{return results.success(values,input);}};};exports.oneOrMore=function(rule){return exports.oneOrMoreWithSeparator(rule,noOpRule);};function noOpRule(input){return results.success(null,input);}
var repeatedWithSeparator=function(rule,separator,isOneOrMore){return function(input){var result=rule(input);if(result.isSuccess()){var mainRule=exports.sequence.capture(rule,"main");var remainingRule=zeroOrMore(exports.then(exports.sequence(separator,mainRule),exports.sequence.extract(mainRule)));var remainingResult=remainingRule(result.remaining());return results.success([result.value()].concat(remainingResult.value()),remainingResult.remaining());}else if(isOneOrMore||result.isError()){return result;}else{return results.success([],input);}};};exports.leftAssociative=function(leftRule,rightRule,func){var rights;if(func){rights=[{func:func,rule:rightRule}];}else{rights=rightRule;}
rights=rights.map(function(right){return exports.then(right.rule,function(rightValue){return function(leftValue,source){return right.func(leftValue,rightValue,source);};});});var repeatedRule=exports.firstOf.apply(null,["rules"].concat(rights));return function(input){var start=input;var leftResult=leftRule(input);if(!leftResult.isSuccess()){return leftResult;}
var repeatedResult=repeatedRule(leftResult.remaining());while(repeatedResult.isSuccess()){var remaining=repeatedResult.remaining();var source=start.to(repeatedResult.remaining());var right=repeatedResult.value();leftResult=results.success(right(leftResult.value(),source),remaining,source);repeatedResult=repeatedRule(leftResult.remaining());}
if(repeatedResult.isError()){return repeatedResult;}
return leftResult;};};exports.leftAssociative.firstOf=function(){return Array.prototype.slice.call(arguments,0);};exports.nonConsuming=function(rule){return function(input){return rule(input).changeRemaining(input);};};var describeToken=function(token){if(token.value){return token.name+" \""+token.value+"\"";}else{return token.name;}};function describeTokenMismatch(input,expected){var error;var token=input.head();if(token){error=errors.error({expected:expected,actual:describeToken(token),location:token.source});}else{error=errors.error({expected:expected,actual:"end of tokens"});}
return results.failure([error],input);}},{"./errors":112,"./lazy-iterators":113,"./parsing-results":115,"option":119,"underscore":118}],118:[function(require,module,exports){(function(){var root=this;var previousUnderscore=root._;var breaker={};var ArrayProto=Array.prototype,ObjProto=Object.prototype,FuncProto=Function.prototype;var push=ArrayProto.push,slice=ArrayProto.slice,concat=ArrayProto.concat,toString=ObjProto.toString,hasOwnProperty=ObjProto.hasOwnProperty;var
nativeForEach=ArrayProto.forEach,nativeMap=ArrayProto.map,nativeReduce=ArrayProto.reduce,nativeReduceRight=ArrayProto.reduceRight,nativeFilter=ArrayProto.filter,nativeEvery=ArrayProto.every,nativeSome=ArrayProto.some,nativeIndexOf=ArrayProto.indexOf,nativeLastIndexOf=ArrayProto.lastIndexOf,nativeIsArray=Array.isArray,nativeKeys=Object.keys,nativeBind=FuncProto.bind;var _=function(obj){if(obj instanceof _)return obj;if(!(this instanceof _))return new _(obj);this._wrapped=obj;};if(typeof exports!=='undefined'){if(typeof module!=='undefined'&&module.exports){exports=module.exports=_;}
exports._=_;}else{root._=_;}
_.VERSION='1.4.4';var each=_.each=_.forEach=function(obj,iterator,context){if(obj==null)return;if(nativeForEach&&obj.forEach===nativeForEach){obj.forEach(iterator,context);}else if(obj.length===+obj.length){for(var i=0,l=obj.length;i<l;i++){if(iterator.call(context,obj[i],i,obj)===breaker)return;}}else{for(var key in obj){if(_.has(obj,key)){if(iterator.call(context,obj[key],key,obj)===breaker)return;}}}};_.map=_.collect=function(obj,iterator,context){var results=[];if(obj==null)return results;if(nativeMap&&obj.map===nativeMap)return obj.map(iterator,context);each(obj,function(value,index,list){results[results.length]=iterator.call(context,value,index,list);});return results;};var reduceError='Reduce of empty array with no initial value';_.reduce=_.foldl=_.inject=function(obj,iterator,memo,context){var initial=arguments.length>2;if(obj==null)obj=[];if(nativeReduce&&obj.reduce===nativeReduce){if(context)iterator=_.bind(iterator,context);return initial?obj.reduce(iterator,memo):obj.reduce(iterator);}
each(obj,function(value,index,list){if(!initial){memo=value;initial=true;}else{memo=iterator.call(context,memo,value,index,list);}});if(!initial)throw new TypeError(reduceError);return memo;};_.reduceRight=_.foldr=function(obj,iterator,memo,context){var initial=arguments.length>2;if(obj==null)obj=[];if(nativeReduceRight&&obj.reduceRight===nativeReduceRight){if(context)iterator=_.bind(iterator,context);return initial?obj.reduceRight(iterator,memo):obj.reduceRight(iterator);}
var length=obj.length;if(length!==+length){var keys=_.keys(obj);length=keys.length;}
each(obj,function(value,index,list){index=keys?keys[--length]:--length;if(!initial){memo=obj[index];initial=true;}else{memo=iterator.call(context,memo,obj[index],index,list);}});if(!initial)throw new TypeError(reduceError);return memo;};_.find=_.detect=function(obj,iterator,context){var result;any(obj,function(value,index,list){if(iterator.call(context,value,index,list)){result=value;return true;}});return result;};_.filter=_.select=function(obj,iterator,context){var results=[];if(obj==null)return results;if(nativeFilter&&obj.filter===nativeFilter)return obj.filter(iterator,context);each(obj,function(value,index,list){if(iterator.call(context,value,index,list))results[results.length]=value;});return results;};_.reject=function(obj,iterator,context){return _.filter(obj,function(value,index,list){return!iterator.call(context,value,index,list);},context);};_.every=_.all=function(obj,iterator,context){iterator||(iterator=_.identity);var result=true;if(obj==null)return result;if(nativeEvery&&obj.every===nativeEvery)return obj.every(iterator,context);each(obj,function(value,index,list){if(!(result=result&&iterator.call(context,value,index,list)))return breaker;});return!!result;};var any=_.some=_.any=function(obj,iterator,context){iterator||(iterator=_.identity);var result=false;if(obj==null)return result;if(nativeSome&&obj.some===nativeSome)return obj.some(iterator,context);each(obj,function(value,index,list){if(result||(result=iterator.call(context,value,index,list)))return breaker;});return!!result;};_.contains=_.include=function(obj,target){if(obj==null)return false;if(nativeIndexOf&&obj.indexOf===nativeIndexOf)return obj.indexOf(target)!=-1;return any(obj,function(value){return value===target;});};_.invoke=function(obj,method){var args=slice.call(arguments,2);var isFunc=_.isFunction(method);return _.map(obj,function(value){return(isFunc?method:value[method]).apply(value,args);});};_.pluck=function(obj,key){return _.map(obj,function(value){return value[key];});};_.where=function(obj,attrs,first){if(_.isEmpty(attrs))return first?null:[];return _[first?'find':'filter'](obj,function(value){for(var key in attrs){if(attrs[key]!==value[key])return false;}
return true;});};_.findWhere=function(obj,attrs){return _.where(obj,attrs,true);};_.max=function(obj,iterator,context){if(!iterator&&_.isArray(obj)&&obj[0]===+obj[0]&&obj.length<65535){return Math.max.apply(Math,obj);}
if(!iterator&&_.isEmpty(obj))return-Infinity;var result={computed:-Infinity,value:-Infinity};each(obj,function(value,index,list){var computed=iterator?iterator.call(context,value,index,list):value;computed>=result.computed&&(result={value:value,computed:computed});});return result.value;};_.min=function(obj,iterator,context){if(!iterator&&_.isArray(obj)&&obj[0]===+obj[0]&&obj.length<65535){return Math.min.apply(Math,obj);}
if(!iterator&&_.isEmpty(obj))return Infinity;var result={computed:Infinity,value:Infinity};each(obj,function(value,index,list){var computed=iterator?iterator.call(context,value,index,list):value;computed<result.computed&&(result={value:value,computed:computed});});return result.value;};_.shuffle=function(obj){var rand;var index=0;var shuffled=[];each(obj,function(value){rand=_.random(index++);shuffled[index-1]=shuffled[rand];shuffled[rand]=value;});return shuffled;};var lookupIterator=function(value){return _.isFunction(value)?value:function(obj){return obj[value];};};_.sortBy=function(obj,value,context){var iterator=lookupIterator(value);return _.pluck(_.map(obj,function(value,index,list){return{value:value,index:index,criteria:iterator.call(context,value,index,list)};}).sort(function(left,right){var a=left.criteria;var b=right.criteria;if(a!==b){if(a>b||a===void 0)return 1;if(a<b||b===void 0)return-1;}
return left.index<right.index?-1:1;}),'value');};var group=function(obj,value,context,behavior){var result={};var iterator=lookupIterator(value||_.identity);each(obj,function(value,index){var key=iterator.call(context,value,index,obj);behavior(result,key,value);});return result;};_.groupBy=function(obj,value,context){return group(obj,value,context,function(result,key,value){(_.has(result,key)?result[key]:(result[key]=[])).push(value);});};_.countBy=function(obj,value,context){return group(obj,value,context,function(result,key){if(!_.has(result,key))result[key]=0;result[key]++;});};_.sortedIndex=function(array,obj,iterator,context){iterator=iterator==null?_.identity:lookupIterator(iterator);var value=iterator.call(context,obj);var low=0,high=array.length;while(low<high){var mid=(low+high)>>>1;iterator.call(context,array[mid])<value?low=mid+1:high=mid;}
return low;};_.toArray=function(obj){if(!obj)return[];if(_.isArray(obj))return slice.call(obj);if(obj.length===+obj.length)return _.map(obj,_.identity);return _.values(obj);};_.size=function(obj){if(obj==null)return 0;return(obj.length===+obj.length)?obj.length:_.keys(obj).length;};_.first=_.head=_.take=function(array,n,guard){if(array==null)return void 0;return(n!=null)&&!guard?slice.call(array,0,n):array[0];};_.initial=function(array,n,guard){return slice.call(array,0,array.length-((n==null)||guard?1:n));};_.last=function(array,n,guard){if(array==null)return void 0;if((n!=null)&&!guard){return slice.call(array,Math.max(array.length-n,0));}else{return array[array.length-1];}};_.rest=_.tail=_.drop=function(array,n,guard){return slice.call(array,(n==null)||guard?1:n);};_.compact=function(array){return _.filter(array,_.identity);};var flatten=function(input,shallow,output){each(input,function(value){if(_.isArray(value)){shallow?push.apply(output,value):flatten(value,shallow,output);}else{output.push(value);}});return output;};_.flatten=function(array,shallow){return flatten(array,shallow,[]);};_.without=function(array){return _.difference(array,slice.call(arguments,1));};_.uniq=_.unique=function(array,isSorted,iterator,context){if(_.isFunction(isSorted)){context=iterator;iterator=isSorted;isSorted=false;}
var initial=iterator?_.map(array,iterator,context):array;var results=[];var seen=[];each(initial,function(value,index){if(isSorted?(!index||seen[seen.length-1]!==value):!_.contains(seen,value)){seen.push(value);results.push(array[index]);}});return results;};_.union=function(){return _.uniq(concat.apply(ArrayProto,arguments));};_.intersection=function(array){var rest=slice.call(arguments,1);return _.filter(_.uniq(array),function(item){return _.every(rest,function(other){return _.indexOf(other,item)>=0;});});};_.difference=function(array){var rest=concat.apply(ArrayProto,slice.call(arguments,1));return _.filter(array,function(value){return!_.contains(rest,value);});};_.zip=function(){var args=slice.call(arguments);var length=_.max(_.pluck(args,'length'));var results=new Array(length);for(var i=0;i<length;i++){results[i]=_.pluck(args,""+i);}
return results;};_.object=function(list,values){if(list==null)return{};var result={};for(var i=0,l=list.length;i<l;i++){if(values){result[list[i]]=values[i];}else{result[list[i][0]]=list[i][1];}}
return result;};_.indexOf=function(array,item,isSorted){if(array==null)return-1;var i=0,l=array.length;if(isSorted){if(typeof isSorted=='number'){i=(isSorted<0?Math.max(0,l+isSorted):isSorted);}else{i=_.sortedIndex(array,item);return array[i]===item?i:-1;}}
if(nativeIndexOf&&array.indexOf===nativeIndexOf)return array.indexOf(item,isSorted);for(;i<l;i++)if(array[i]===item)return i;return-1;};_.lastIndexOf=function(array,item,from){if(array==null)return-1;var hasIndex=from!=null;if(nativeLastIndexOf&&array.lastIndexOf===nativeLastIndexOf){return hasIndex?array.lastIndexOf(item,from):array.lastIndexOf(item);}
var i=(hasIndex?from:array.length);while(i--)if(array[i]===item)return i;return-1;};_.range=function(start,stop,step){if(arguments.length<=1){stop=start||0;start=0;}
step=arguments[2]||1;var len=Math.max(Math.ceil((stop-start)/step),0);var idx=0;var range=new Array(len);while(idx<len){range[idx++]=start;start+=step;}
return range;};_.bind=function(func,context){if(func.bind===nativeBind&&nativeBind)return nativeBind.apply(func,slice.call(arguments,1));var args=slice.call(arguments,2);return function(){return func.apply(context,args.concat(slice.call(arguments)));};};_.partial=function(func){var args=slice.call(arguments,1);return function(){return func.apply(this,args.concat(slice.call(arguments)));};};_.bindAll=function(obj){var funcs=slice.call(arguments,1);if(funcs.length===0)funcs=_.functions(obj);each(funcs,function(f){obj[f]=_.bind(obj[f],obj);});return obj;};_.memoize=function(func,hasher){var memo={};hasher||(hasher=_.identity);return function(){var key=hasher.apply(this,arguments);return _.has(memo,key)?memo[key]:(memo[key]=func.apply(this,arguments));};};_.delay=function(func,wait){var args=slice.call(arguments,2);return setTimeout(function(){return func.apply(null,args);},wait);};_.defer=function(func){return _.delay.apply(_,[func,1].concat(slice.call(arguments,1)));};_.throttle=function(func,wait){var context,args,timeout,result;var previous=0;var later=function(){previous=new Date;timeout=null;result=func.apply(context,args);};return function(){var now=new Date;var remaining=wait-(now-previous);context=this;args=arguments;if(remaining<=0){clearTimeout(timeout);timeout=null;previous=now;result=func.apply(context,args);}else if(!timeout){timeout=setTimeout(later,remaining);}
return result;};};_.debounce=function(func,wait,immediate){var timeout,result;return function(){var context=this,args=arguments;var later=function(){timeout=null;if(!immediate)result=func.apply(context,args);};var callNow=immediate&&!timeout;clearTimeout(timeout);timeout=setTimeout(later,wait);if(callNow)result=func.apply(context,args);return result;};};_.once=function(func){var ran=false,memo;return function(){if(ran)return memo;ran=true;memo=func.apply(this,arguments);func=null;return memo;};};_.wrap=function(func,wrapper){return function(){var args=[func];push.apply(args,arguments);return wrapper.apply(this,args);};};_.compose=function(){var funcs=arguments;return function(){var args=arguments;for(var i=funcs.length-1;i>=0;i--){args=[funcs[i].apply(this,args)];}
return args[0];};};_.after=function(times,func){if(times<=0)return func();return function(){if(--times<1){return func.apply(this,arguments);}};};_.keys=nativeKeys||function(obj){if(obj!==Object(obj))throw new TypeError('Invalid object');var keys=[];for(var key in obj)if(_.has(obj,key))keys[keys.length]=key;return keys;};_.values=function(obj){var values=[];for(var key in obj)if(_.has(obj,key))values.push(obj[key]);return values;};_.pairs=function(obj){var pairs=[];for(var key in obj)if(_.has(obj,key))pairs.push([key,obj[key]]);return pairs;};_.invert=function(obj){var result={};for(var key in obj)if(_.has(obj,key))result[obj[key]]=key;return result;};_.functions=_.methods=function(obj){var names=[];for(var key in obj){if(_.isFunction(obj[key]))names.push(key);}
return names.sort();};_.extend=function(obj){each(slice.call(arguments,1),function(source){if(source){for(var prop in source){obj[prop]=source[prop];}}});return obj;};_.pick=function(obj){var copy={};var keys=concat.apply(ArrayProto,slice.call(arguments,1));each(keys,function(key){if(key in obj)copy[key]=obj[key];});return copy;};_.omit=function(obj){var copy={};var keys=concat.apply(ArrayProto,slice.call(arguments,1));for(var key in obj){if(!_.contains(keys,key))copy[key]=obj[key];}
return copy;};_.defaults=function(obj){each(slice.call(arguments,1),function(source){if(source){for(var prop in source){if(obj[prop]==null)obj[prop]=source[prop];}}});return obj;};_.clone=function(obj){if(!_.isObject(obj))return obj;return _.isArray(obj)?obj.slice():_.extend({},obj);};_.tap=function(obj,interceptor){interceptor(obj);return obj;};var eq=function(a,b,aStack,bStack){if(a===b)return a!==0||1/a==1/b;if(a==null||b==null)return a===b;if(a instanceof _)a=a._wrapped;if(b instanceof _)b=b._wrapped;var className=toString.call(a);if(className!=toString.call(b))return false;switch(className){case '[object String]':return a==String(b);case '[object Number]':return a!=+a?b!=+b:(a==0?1/a==1/b:a==+b);case '[object Date]':case '[object Boolean]':return+a==+b;case '[object RegExp]':return a.source==b.source&&a.global==b.global&&a.multiline==b.multiline&&a.ignoreCase==b.ignoreCase;}
if(typeof a!='object'||typeof b!='object')return false;var length=aStack.length;while(length--){if(aStack[length]==a)return bStack[length]==b;}
aStack.push(a);bStack.push(b);var size=0,result=true;if(className=='[object Array]'){size=a.length;result=size==b.length;if(result){while(size--){if(!(result=eq(a[size],b[size],aStack,bStack)))break;}}}else{var aCtor=a.constructor,bCtor=b.constructor;if(aCtor!==bCtor&&!(_.isFunction(aCtor)&&(aCtor instanceof aCtor)&&_.isFunction(bCtor)&&(bCtor instanceof bCtor))){return false;}
for(var key in a){if(_.has(a,key)){size++;if(!(result=_.has(b,key)&&eq(a[key],b[key],aStack,bStack)))break;}}
if(result){for(key in b){if(_.has(b,key)&&!(size--))break;}
result=!size;}}
aStack.pop();bStack.pop();return result;};_.isEqual=function(a,b){return eq(a,b,[],[]);};_.isEmpty=function(obj){if(obj==null)return true;if(_.isArray(obj)||_.isString(obj))return obj.length===0;for(var key in obj)if(_.has(obj,key))return false;return true;};_.isElement=function(obj){return!!(obj&&obj.nodeType===1);};_.isArray=nativeIsArray||function(obj){return toString.call(obj)=='[object Array]';};_.isObject=function(obj){return obj===Object(obj);};each(['Arguments','Function','String','Number','Date','RegExp'],function(name){_['is'+name]=function(obj){return toString.call(obj)=='[object '+name+']';};});if(!_.isArguments(arguments)){_.isArguments=function(obj){return!!(obj&&_.has(obj,'callee'));};}
if(typeof(/./)!=='function'){_.isFunction=function(obj){return typeof obj==='function';};}
_.isFinite=function(obj){return isFinite(obj)&&!isNaN(parseFloat(obj));};_.isNaN=function(obj){return _.isNumber(obj)&&obj!=+obj;};_.isBoolean=function(obj){return obj===true||obj===false||toString.call(obj)=='[object Boolean]';};_.isNull=function(obj){return obj===null;};_.isUndefined=function(obj){return obj===void 0;};_.has=function(obj,key){return hasOwnProperty.call(obj,key);};_.noConflict=function(){root._=previousUnderscore;return this;};_.identity=function(value){return value;};_.times=function(n,iterator,context){var accum=Array(n);for(var i=0;i<n;i++)accum[i]=iterator.call(context,i);return accum;};_.random=function(min,max){if(max==null){max=min;min=0;}
return min+Math.floor(Math.random()*(max-min+1));};var entityMap={escape:{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','/':'&#x2F;'}};entityMap.unescape=_.invert(entityMap.escape);var entityRegexes={escape:new RegExp('['+_.keys(entityMap.escape).join('')+']','g'),unescape:new RegExp('('+_.keys(entityMap.unescape).join('|')+')','g')};_.each(['escape','unescape'],function(method){_[method]=function(string){if(string==null)return '';return(''+string).replace(entityRegexes[method],function(match){return entityMap[method][match];});};});_.result=function(object,property){if(object==null)return null;var value=object[property];return _.isFunction(value)?value.call(object):value;};_.mixin=function(obj){each(_.functions(obj),function(name){var func=_[name]=obj[name];_.prototype[name]=function(){var args=[this._wrapped];push.apply(args,arguments);return result.call(this,func.apply(_,args));};});};var idCounter=0;_.uniqueId=function(prefix){var id=++idCounter+'';return prefix?prefix+id:id;};_.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var noMatch=/(.)^/;var escapes={"'":"'",'\\':'\\','\r':'r','\n':'n','\t':'t','\u2028':'u2028','\u2029':'u2029'};var escaper=/\\|'|\r|\n|\t|\u2028|\u2029/g;_.template=function(text,data,settings){var render;settings=_.defaults({},settings,_.templateSettings);var matcher=new RegExp([(settings.escape||noMatch).source,(settings.interpolate||noMatch).source,(settings.evaluate||noMatch).source].join('|')+'|$','g');var index=0;var source="__p+='";text.replace(matcher,function(match,escape,interpolate,evaluate,offset){source+=text.slice(index,offset).replace(escaper,function(match){return '\\'+escapes[match];});if(escape){source+="'+\n((__t=("+escape+"))==null?'':_.escape(__t))+\n'";}
if(interpolate){source+="'+\n((__t=("+interpolate+"))==null?'':__t)+\n'";}
if(evaluate){source+="';\n"+evaluate+"\n__p+='";}
index=offset+match.length;return match;});source+="';\n";if(!settings.variable)source='with(obj||{}){\n'+source+'}\n';source="var __t,__p='',__j=Array.prototype.join,"+
"print=function(){__p+=__j.call(arguments,'');};\n"+
source+"return __p;\n";try{render=new Function(settings.variable||'obj','_',source);}catch(e){e.source=source;throw e;}
if(data)return render(data,_);var template=function(data){return render.call(this,data,_);};template.source='function('+(settings.variable||'obj')+'){\n'+source+'}';return template;};_.chain=function(obj){return _(obj).chain();};var result=function(obj){return this._chain?_(obj).chain():obj;};_.mixin(_);each(['pop','push','reverse','shift','sort','splice','unshift'],function(name){var method=ArrayProto[name];_.prototype[name]=function(){var obj=this._wrapped;method.apply(obj,arguments);if((name=='shift'||name=='splice')&&obj.length===0)delete obj[0];return result.call(this,obj);};});each(['concat','join','slice'],function(name){var method=ArrayProto[name];_.prototype[name]=function(){return result.call(this,method.apply(this._wrapped,arguments));};});_.extend(_.prototype,{chain:function(){this._chain=true;return this;},value:function(){return this._wrapped;}});}).call(this);},{}],119:[function(require,module,exports){exports.none=Object.create({value:function(){throw new Error('Called value on none');},isNone:function(){return true;},isSome:function(){return false;},map:function(){return exports.none;},flatMap:function(){return exports.none;},toArray:function(){return[];},orElse:callOrReturn,valueOrElse:callOrReturn});function callOrReturn(value){if(typeof(value)=="function"){return value();}else{return value;}}
exports.some=function(value){return new Some(value);};var Some=function(value){this._value=value;};Some.prototype.value=function(){return this._value;};Some.prototype.isNone=function(){return false;};Some.prototype.isSome=function(){return true;};Some.prototype.map=function(func){return new Some(func(this._value));};Some.prototype.flatMap=function(func){return func(this._value);};Some.prototype.toArray=function(){return[this._value];};Some.prototype.orElse=function(value){return this;};Some.prototype.valueOrElse=function(value){return this._value;};exports.isOption=function(value){return value===exports.none||value instanceof Some;};exports.fromNullable=function(value){if(value==null){return exports.none;}
return new Some(value);}},{}],120:[function(require,module,exports){'use strict';var assign=require('./lib/utils/common').assign;var deflate=require('./lib/deflate');var inflate=require('./lib/inflate');var constants=require('./lib/zlib/constants');var pako={};assign(pako,deflate,inflate,constants);module.exports=pako;},{"./lib/deflate":121,"./lib/inflate":122,"./lib/utils/common":123,"./lib/zlib/constants":126}],121:[function(require,module,exports){'use strict';var zlib_deflate=require('./zlib/deflate');var utils=require('./utils/common');var strings=require('./utils/strings');var msg=require('./zlib/messages');var ZStream=require('./zlib/zstream');var toString=Object.prototype.toString;var Z_NO_FLUSH=0;var Z_FINISH=4;var Z_OK=0;var Z_STREAM_END=1;var Z_SYNC_FLUSH=2;var Z_DEFAULT_COMPRESSION=-1;var Z_DEFAULT_STRATEGY=0;var Z_DEFLATED=8;function Deflate(options){if(!(this instanceof Deflate))return new Deflate(options);this.options=utils.assign({level:Z_DEFAULT_COMPRESSION,method:Z_DEFLATED,chunkSize:16384,windowBits:15,memLevel:8,strategy:Z_DEFAULT_STRATEGY,to:''},options||{});var opt=this.options;if(opt.raw&&(opt.windowBits>0)){opt.windowBits=-opt.windowBits;}
else if(opt.gzip&&(opt.windowBits>0)&&(opt.windowBits<16)){opt.windowBits+=16;}
this.err=0;this.msg='';this.ended=false;this.chunks=[];this.strm=new ZStream();this.strm.avail_out=0;var status=zlib_deflate.deflateInit2(this.strm,opt.level,opt.method,opt.windowBits,opt.memLevel,opt.strategy);if(status!==Z_OK){throw new Error(msg[status]);}
if(opt.header){zlib_deflate.deflateSetHeader(this.strm,opt.header);}
if(opt.dictionary){var dict;if(typeof opt.dictionary==='string'){dict=strings.string2buf(opt.dictionary);}else if(toString.call(opt.dictionary)==='[object ArrayBuffer]'){dict=new Uint8Array(opt.dictionary);}else{dict=opt.dictionary;}
status=zlib_deflate.deflateSetDictionary(this.strm,dict);if(status!==Z_OK){throw new Error(msg[status]);}
this._dict_set=true;}}
Deflate.prototype.push=function(data,mode){var strm=this.strm;var chunkSize=this.options.chunkSize;var status,_mode;if(this.ended){return false;}
_mode=(mode===~~mode)?mode:((mode===true)?Z_FINISH:Z_NO_FLUSH);if(typeof data==='string'){strm.input=strings.string2buf(data);}else if(toString.call(data)==='[object ArrayBuffer]'){strm.input=new Uint8Array(data);}else{strm.input=data;}
strm.next_in=0;strm.avail_in=strm.input.length;do{if(strm.avail_out===0){strm.output=new utils.Buf8(chunkSize);strm.next_out=0;strm.avail_out=chunkSize;}
status=zlib_deflate.deflate(strm,_mode);if(status!==Z_STREAM_END&&status!==Z_OK){this.onEnd(status);this.ended=true;return false;}
if(strm.avail_out===0||(strm.avail_in===0&&(_mode===Z_FINISH||_mode===Z_SYNC_FLUSH))){if(this.options.to==='string'){this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output,strm.next_out)));}else{this.onData(utils.shrinkBuf(strm.output,strm.next_out));}}}while((strm.avail_in>0||strm.avail_out===0)&&status!==Z_STREAM_END);if(_mode===Z_FINISH){status=zlib_deflate.deflateEnd(this.strm);this.onEnd(status);this.ended=true;return status===Z_OK;}
if(_mode===Z_SYNC_FLUSH){this.onEnd(Z_OK);strm.avail_out=0;return true;}
return true;};Deflate.prototype.onData=function(chunk){this.chunks.push(chunk);};Deflate.prototype.onEnd=function(status){if(status===Z_OK){if(this.options.to==='string'){this.result=this.chunks.join('');}else{this.result=utils.flattenChunks(this.chunks);}}
this.chunks=[];this.err=status;this.msg=this.strm.msg;};function deflate(input,options){var deflator=new Deflate(options);deflator.push(input,true);if(deflator.err){throw deflator.msg;}
return deflator.result;}
function deflateRaw(input,options){options=options||{};options.raw=true;return deflate(input,options);}
function gzip(input,options){options=options||{};options.gzip=true;return deflate(input,options);}
exports.Deflate=Deflate;exports.deflate=deflate;exports.deflateRaw=deflateRaw;exports.gzip=gzip;},{"./utils/common":123,"./utils/strings":124,"./zlib/deflate":128,"./zlib/messages":133,"./zlib/zstream":135}],122:[function(require,module,exports){'use strict';var zlib_inflate=require('./zlib/inflate');var utils=require('./utils/common');var strings=require('./utils/strings');var c=require('./zlib/constants');var msg=require('./zlib/messages');var ZStream=require('./zlib/zstream');var GZheader=require('./zlib/gzheader');var toString=Object.prototype.toString;function Inflate(options){if(!(this instanceof Inflate))return new Inflate(options);this.options=utils.assign({chunkSize:16384,windowBits:0,to:''},options||{});var opt=this.options;if(opt.raw&&(opt.windowBits>=0)&&(opt.windowBits<16)){opt.windowBits=-opt.windowBits;if(opt.windowBits===0){opt.windowBits=-15;}}
if((opt.windowBits>=0)&&(opt.windowBits<16)&&!(options&&options.windowBits)){opt.windowBits+=32;}
if((opt.windowBits>15)&&(opt.windowBits<48)){if((opt.windowBits&15)===0){opt.windowBits|=15;}}
this.err=0;this.msg='';this.ended=false;this.chunks=[];this.strm=new ZStream();this.strm.avail_out=0;var status=zlib_inflate.inflateInit2(this.strm,opt.windowBits);if(status!==c.Z_OK){throw new Error(msg[status]);}
this.header=new GZheader();zlib_inflate.inflateGetHeader(this.strm,this.header);}
Inflate.prototype.push=function(data,mode){var strm=this.strm;var chunkSize=this.options.chunkSize;var dictionary=this.options.dictionary;var status,_mode;var next_out_utf8,tail,utf8str;var dict;var allowBufError=false;if(this.ended){return false;}
_mode=(mode===~~mode)?mode:((mode===true)?c.Z_FINISH:c.Z_NO_FLUSH);if(typeof data==='string'){strm.input=strings.binstring2buf(data);}else if(toString.call(data)==='[object ArrayBuffer]'){strm.input=new Uint8Array(data);}else{strm.input=data;}
strm.next_in=0;strm.avail_in=strm.input.length;do{if(strm.avail_out===0){strm.output=new utils.Buf8(chunkSize);strm.next_out=0;strm.avail_out=chunkSize;}
status=zlib_inflate.inflate(strm,c.Z_NO_FLUSH);if(status===c.Z_NEED_DICT&&dictionary){if(typeof dictionary==='string'){dict=strings.string2buf(dictionary);}else if(toString.call(dictionary)==='[object ArrayBuffer]'){dict=new Uint8Array(dictionary);}else{dict=dictionary;}
status=zlib_inflate.inflateSetDictionary(this.strm,dict);}
if(status===c.Z_BUF_ERROR&&allowBufError===true){status=c.Z_OK;allowBufError=false;}
if(status!==c.Z_STREAM_END&&status!==c.Z_OK){this.onEnd(status);this.ended=true;return false;}
if(strm.next_out){if(strm.avail_out===0||status===c.Z_STREAM_END||(strm.avail_in===0&&(_mode===c.Z_FINISH||_mode===c.Z_SYNC_FLUSH))){if(this.options.to==='string'){next_out_utf8=strings.utf8border(strm.output,strm.next_out);tail=strm.next_out-next_out_utf8;utf8str=strings.buf2string(strm.output,next_out_utf8);strm.next_out=tail;strm.avail_out=chunkSize-tail;if(tail){utils.arraySet(strm.output,strm.output,next_out_utf8,tail,0);}
this.onData(utf8str);}else{this.onData(utils.shrinkBuf(strm.output,strm.next_out));}}}
if(strm.avail_in===0&&strm.avail_out===0){allowBufError=true;}}while((strm.avail_in>0||strm.avail_out===0)&&status!==c.Z_STREAM_END);if(status===c.Z_STREAM_END){_mode=c.Z_FINISH;}
if(_mode===c.Z_FINISH){status=zlib_inflate.inflateEnd(this.strm);this.onEnd(status);this.ended=true;return status===c.Z_OK;}
if(_mode===c.Z_SYNC_FLUSH){this.onEnd(c.Z_OK);strm.avail_out=0;return true;}
return true;};Inflate.prototype.onData=function(chunk){this.chunks.push(chunk);};Inflate.prototype.onEnd=function(status){if(status===c.Z_OK){if(this.options.to==='string'){this.result=this.chunks.join('');}else{this.result=utils.flattenChunks(this.chunks);}}
this.chunks=[];this.err=status;this.msg=this.strm.msg;};function inflate(input,options){var inflator=new Inflate(options);inflator.push(input,true);if(inflator.err){throw inflator.msg;}
return inflator.result;}
function inflateRaw(input,options){options=options||{};options.raw=true;return inflate(input,options);}
exports.Inflate=Inflate;exports.inflate=inflate;exports.inflateRaw=inflateRaw;exports.ungzip=inflate;},{"./utils/common":123,"./utils/strings":124,"./zlib/constants":126,"./zlib/gzheader":129,"./zlib/inflate":131,"./zlib/messages":133,"./zlib/zstream":135}],123:[function(require,module,exports){'use strict';var TYPED_OK=(typeof Uint8Array!=='undefined')&&(typeof Uint16Array!=='undefined')&&(typeof Int32Array!=='undefined');exports.assign=function(obj){var sources=Array.prototype.slice.call(arguments,1);while(sources.length){var source=sources.shift();if(!source){continue;}
if(typeof source!=='object'){throw new TypeError(source+'must be non-object');}
for(var p in source){if(source.hasOwnProperty(p)){obj[p]=source[p];}}}
return obj;};exports.shrinkBuf=function(buf,size){if(buf.length===size){return buf;}
if(buf.subarray){return buf.subarray(0,size);}
buf.length=size;return buf;};var fnTyped={arraySet:function(dest,src,src_offs,len,dest_offs){if(src.subarray&&dest.subarray){dest.set(src.subarray(src_offs,src_offs+len),dest_offs);return;}
for(var i=0;i<len;i++){dest[dest_offs+i]=src[src_offs+i];}},flattenChunks:function(chunks){var i,l,len,pos,chunk,result;len=0;for(i=0,l=chunks.length;i<l;i++){len+=chunks[i].length;}
result=new Uint8Array(len);pos=0;for(i=0,l=chunks.length;i<l;i++){chunk=chunks[i];result.set(chunk,pos);pos+=chunk.length;}
return result;}};var fnUntyped={arraySet:function(dest,src,src_offs,len,dest_offs){for(var i=0;i<len;i++){dest[dest_offs+i]=src[src_offs+i];}},flattenChunks:function(chunks){return[].concat.apply([],chunks);}};exports.setTyped=function(on){if(on){exports.Buf8=Uint8Array;exports.Buf16=Uint16Array;exports.Buf32=Int32Array;exports.assign(exports,fnTyped);}else{exports.Buf8=Array;exports.Buf16=Array;exports.Buf32=Array;exports.assign(exports,fnUntyped);}};exports.setTyped(TYPED_OK);},{}],124:[function(require,module,exports){'use strict';var utils=require('./common');var STR_APPLY_OK=true;var STR_APPLY_UIA_OK=true;try{String.fromCharCode.apply(null,[0]);}catch(__){STR_APPLY_OK=false;}
try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(__){STR_APPLY_UIA_OK=false;}
var _utf8len=new utils.Buf8(256);for(var q=0;q<256;q++){_utf8len[q]=(q>=252?6:q>=248?5:q>=240?4:q>=224?3:q>=192?2:1);}
_utf8len[254]=_utf8len[254]=1;exports.string2buf=function(str){var buf,c,c2,m_pos,i,str_len=str.length,buf_len=0;for(m_pos=0;m_pos<str_len;m_pos++){c=str.charCodeAt(m_pos);if((c&0xfc00)===0xd800&&(m_pos+1<str_len)){c2=str.charCodeAt(m_pos+1);if((c2&0xfc00)===0xdc00){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);m_pos++;}}
buf_len+=c<0x80?1:c<0x800?2:c<0x10000?3:4;}
buf=new utils.Buf8(buf_len);for(i=0,m_pos=0;i<buf_len;m_pos++){c=str.charCodeAt(m_pos);if((c&0xfc00)===0xd800&&(m_pos+1<str_len)){c2=str.charCodeAt(m_pos+1);if((c2&0xfc00)===0xdc00){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);m_pos++;}}
if(c<0x80){buf[i++]=c;}else if(c<0x800){buf[i++]=0xC0|(c>>>6);buf[i++]=0x80|(c&0x3f);}else if(c<0x10000){buf[i++]=0xE0|(c>>>12);buf[i++]=0x80|(c>>>6&0x3f);buf[i++]=0x80|(c&0x3f);}else{buf[i++]=0xf0|(c>>>18);buf[i++]=0x80|(c>>>12&0x3f);buf[i++]=0x80|(c>>>6&0x3f);buf[i++]=0x80|(c&0x3f);}}
return buf;};function buf2binstring(buf,len){if(len<65537){if((buf.subarray&&STR_APPLY_UIA_OK)||(!buf.subarray&&STR_APPLY_OK)){return String.fromCharCode.apply(null,utils.shrinkBuf(buf,len));}}
var result='';for(var i=0;i<len;i++){result+=String.fromCharCode(buf[i]);}
return result;}
exports.buf2binstring=function(buf){return buf2binstring(buf,buf.length);};exports.binstring2buf=function(str){var buf=new utils.Buf8(str.length);for(var i=0,len=buf.length;i<len;i++){buf[i]=str.charCodeAt(i);}
return buf;};exports.buf2string=function(buf,max){var i,out,c,c_len;var len=max||buf.length;var utf16buf=new Array(len*2);for(out=0,i=0;i<len;){c=buf[i++];if(c<0x80){utf16buf[out++]=c;continue;}
c_len=_utf8len[c];if(c_len>4){utf16buf[out++]=0xfffd;i+=c_len-1;continue;}
c&=c_len===2?0x1f:c_len===3?0x0f:0x07;while(c_len>1&&i<len){c=(c<<6)|(buf[i++]&0x3f);c_len--;}
if(c_len>1){utf16buf[out++]=0xfffd;continue;}
if(c<0x10000){utf16buf[out++]=c;}else{c-=0x10000;utf16buf[out++]=0xd800|((c>>10)&0x3ff);utf16buf[out++]=0xdc00|(c&0x3ff);}}
return buf2binstring(utf16buf,out);};exports.utf8border=function(buf,max){var pos;max=max||buf.length;if(max>buf.length){max=buf.length;}
pos=max-1;while(pos>=0&&(buf[pos]&0xC0)===0x80){pos--;}
if(pos<0){return max;}
if(pos===0){return max;}
return(pos+_utf8len[buf[pos]]>max)?pos:max;};},{"./common":123}],125:[function(require,module,exports){'use strict';function adler32(adler,buf,len,pos){var s1=(adler&0xffff)|0,s2=((adler>>>16)&0xffff)|0,n=0;while(len!==0){n=len>2000?2000:len;len-=n;do{s1=(s1+buf[pos++])|0;s2=(s2+s1)|0;}while(--n);s1%=65521;s2%=65521;}
return(s1|(s2<<16))|0;}
module.exports=adler32;},{}],126:[function(require,module,exports){'use strict';module.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};},{}],127:[function(require,module,exports){'use strict';function makeTable(){var c,table=[];for(var n=0;n<256;n++){c=n;for(var k=0;k<8;k++){c=((c&1)?(0xEDB88320^(c>>>1)):(c>>>1));}
table[n]=c;}
return table;}
var crcTable=makeTable();function crc32(crc,buf,len,pos){var t=crcTable,end=pos+len;crc^=-1;for(var i=pos;i<end;i++){crc=(crc>>>8)^t[(crc^buf[i])&0xFF];}
return(crc^(-1));}
module.exports=crc32;},{}],128:[function(require,module,exports){'use strict';var utils=require('../utils/common');var trees=require('./trees');var adler32=require('./adler32');var crc32=require('./crc32');var msg=require('./messages');var Z_NO_FLUSH=0;var Z_PARTIAL_FLUSH=1;var Z_FULL_FLUSH=3;var Z_FINISH=4;var Z_BLOCK=5;var Z_OK=0;var Z_STREAM_END=1;var Z_STREAM_ERROR=-2;var Z_DATA_ERROR=-3;var Z_BUF_ERROR=-5;var Z_DEFAULT_COMPRESSION=-1;var Z_FILTERED=1;var Z_HUFFMAN_ONLY=2;var Z_RLE=3;var Z_FIXED=4;var Z_DEFAULT_STRATEGY=0;var Z_UNKNOWN=2;var Z_DEFLATED=8;var MAX_MEM_LEVEL=9;var MAX_WBITS=15;var DEF_MEM_LEVEL=8;var LENGTH_CODES=29;var LITERALS=256;var L_CODES=LITERALS+1+LENGTH_CODES;var D_CODES=30;var BL_CODES=19;var HEAP_SIZE=2*L_CODES+1;var MAX_BITS=15;var MIN_MATCH=3;var MAX_MATCH=258;var MIN_LOOKAHEAD=(MAX_MATCH+MIN_MATCH+1);var PRESET_DICT=0x20;var INIT_STATE=42;var EXTRA_STATE=69;var NAME_STATE=73;var COMMENT_STATE=91;var HCRC_STATE=103;var BUSY_STATE=113;var FINISH_STATE=666;var BS_NEED_MORE=1;var BS_BLOCK_DONE=2;var BS_FINISH_STARTED=3;var BS_FINISH_DONE=4;var OS_CODE=0x03;function err(strm,errorCode){strm.msg=msg[errorCode];return errorCode;}
function rank(f){return((f)<<1)-((f)>4?9:0);}
function zero(buf){var len=buf.length;while(--len>=0){buf[len]=0;}}
function flush_pending(strm){var s=strm.state;var len=s.pending;if(len>strm.avail_out){len=strm.avail_out;}
if(len===0){return;}
utils.arraySet(strm.output,s.pending_buf,s.pending_out,len,strm.next_out);strm.next_out+=len;s.pending_out+=len;strm.total_out+=len;strm.avail_out-=len;s.pending-=len;if(s.pending===0){s.pending_out=0;}}
function flush_block_only(s,last){trees._tr_flush_block(s,(s.block_start>=0?s.block_start:-1),s.strstart-s.block_start,last);s.block_start=s.strstart;flush_pending(s.strm);}
function put_byte(s,b){s.pending_buf[s.pending++]=b;}
function putShortMSB(s,b){s.pending_buf[s.pending++]=(b>>>8)&0xff;s.pending_buf[s.pending++]=b&0xff;}
function read_buf(strm,buf,start,size){var len=strm.avail_in;if(len>size){len=size;}
if(len===0){return 0;}
strm.avail_in-=len;utils.arraySet(buf,strm.input,strm.next_in,len,start);if(strm.state.wrap===1){strm.adler=adler32(strm.adler,buf,len,start);}
else if(strm.state.wrap===2){strm.adler=crc32(strm.adler,buf,len,start);}
strm.next_in+=len;strm.total_in+=len;return len;}
function longest_match(s,cur_match){var chain_length=s.max_chain_length;var scan=s.strstart;var match;var len;var best_len=s.prev_length;var nice_match=s.nice_match;var limit=(s.strstart>(s.w_size-MIN_LOOKAHEAD))?s.strstart-(s.w_size-MIN_LOOKAHEAD):0;var _win=s.window;var wmask=s.w_mask;var prev=s.prev;var strend=s.strstart+MAX_MATCH;var scan_end1=_win[scan+best_len-1];var scan_end=_win[scan+best_len];if(s.prev_length>=s.good_match){chain_length>>=2;}
if(nice_match>s.lookahead){nice_match=s.lookahead;}
do{match=cur_match;if(_win[match+best_len]!==scan_end||_win[match+best_len-1]!==scan_end1||_win[match]!==_win[scan]||_win[++match]!==_win[scan+1]){continue;}
scan+=2;match++;do{}while(_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&_win[++scan]===_win[++match]&&scan<strend);len=MAX_MATCH-(strend-scan);scan=strend-MAX_MATCH;if(len>best_len){s.match_start=cur_match;best_len=len;if(len>=nice_match){break;}
scan_end1=_win[scan+best_len-1];scan_end=_win[scan+best_len];}}while((cur_match=prev[cur_match&wmask])>limit&&--chain_length!==0);if(best_len<=s.lookahead){return best_len;}
return s.lookahead;}
function fill_window(s){var _w_size=s.w_size;var p,n,m,more,str;do{more=s.window_size-s.lookahead-s.strstart;if(s.strstart>=_w_size+(_w_size-MIN_LOOKAHEAD)){utils.arraySet(s.window,s.window,_w_size,_w_size,0);s.match_start-=_w_size;s.strstart-=_w_size;s.block_start-=_w_size;n=s.hash_size;p=n;do{m=s.head[--p];s.head[p]=(m>=_w_size?m-_w_size:0);}while(--n);n=_w_size;p=n;do{m=s.prev[--p];s.prev[p]=(m>=_w_size?m-_w_size:0);}while(--n);more+=_w_size;}
if(s.strm.avail_in===0){break;}
n=read_buf(s.strm,s.window,s.strstart+s.lookahead,more);s.lookahead+=n;if(s.lookahead+s.insert>=MIN_MATCH){str=s.strstart-s.insert;s.ins_h=s.window[str];s.ins_h=((s.ins_h<<s.hash_shift)^s.window[str+1])&s.hash_mask;while(s.insert){s.ins_h=((s.ins_h<<s.hash_shift)^s.window[str+MIN_MATCH-1])&s.hash_mask;s.prev[str&s.w_mask]=s.head[s.ins_h];s.head[s.ins_h]=str;str++;s.insert--;if(s.lookahead+s.insert<MIN_MATCH){break;}}}}while(s.lookahead<MIN_LOOKAHEAD&&s.strm.avail_in!==0);}
function deflate_stored(s,flush){var max_block_size=0xffff;if(max_block_size>s.pending_buf_size-5){max_block_size=s.pending_buf_size-5;}
for(;;){if(s.lookahead<=1){fill_window(s);if(s.lookahead===0&&flush===Z_NO_FLUSH){return BS_NEED_MORE;}
if(s.lookahead===0){break;}}
s.strstart+=s.lookahead;s.lookahead=0;var max_start=s.block_start+max_block_size;if(s.strstart===0||s.strstart>=max_start){s.lookahead=s.strstart-max_start;s.strstart=max_start;flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}
if(s.strstart-s.block_start>=(s.w_size-MIN_LOOKAHEAD)){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}}
s.insert=0;if(flush===Z_FINISH){flush_block_only(s,true);if(s.strm.avail_out===0){return BS_FINISH_STARTED;}
return BS_FINISH_DONE;}
if(s.strstart>s.block_start){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}
return BS_NEED_MORE;}
function deflate_fast(s,flush){var hash_head;var bflush;for(;;){if(s.lookahead<MIN_LOOKAHEAD){fill_window(s);if(s.lookahead<MIN_LOOKAHEAD&&flush===Z_NO_FLUSH){return BS_NEED_MORE;}
if(s.lookahead===0){break;}}
hash_head=0;if(s.lookahead>=MIN_MATCH){s.ins_h=((s.ins_h<<s.hash_shift)^s.window[s.strstart+MIN_MATCH-1])&s.hash_mask;hash_head=s.prev[s.strstart&s.w_mask]=s.head[s.ins_h];s.head[s.ins_h]=s.strstart;}
if(hash_head!==0&&((s.strstart-hash_head)<=(s.w_size-MIN_LOOKAHEAD))){s.match_length=longest_match(s,hash_head);}
if(s.match_length>=MIN_MATCH){bflush=trees._tr_tally(s,s.strstart-s.match_start,s.match_length-MIN_MATCH);s.lookahead-=s.match_length;if(s.match_length<=s.max_lazy_match&&s.lookahead>=MIN_MATCH){s.match_length--;do{s.strstart++;s.ins_h=((s.ins_h<<s.hash_shift)^s.window[s.strstart+MIN_MATCH-1])&s.hash_mask;hash_head=s.prev[s.strstart&s.w_mask]=s.head[s.ins_h];s.head[s.ins_h]=s.strstart;}while(--s.match_length!==0);s.strstart++;}else
{s.strstart+=s.match_length;s.match_length=0;s.ins_h=s.window[s.strstart];s.ins_h=((s.ins_h<<s.hash_shift)^s.window[s.strstart+1])&s.hash_mask;}}else{bflush=trees._tr_tally(s,0,s.window[s.strstart]);s.lookahead--;s.strstart++;}
if(bflush){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}}
s.insert=((s.strstart<(MIN_MATCH-1))?s.strstart:MIN_MATCH-1);if(flush===Z_FINISH){flush_block_only(s,true);if(s.strm.avail_out===0){return BS_FINISH_STARTED;}
return BS_FINISH_DONE;}
if(s.last_lit){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}
return BS_BLOCK_DONE;}
function deflate_slow(s,flush){var hash_head;var bflush;var max_insert;for(;;){if(s.lookahead<MIN_LOOKAHEAD){fill_window(s);if(s.lookahead<MIN_LOOKAHEAD&&flush===Z_NO_FLUSH){return BS_NEED_MORE;}
if(s.lookahead===0){break;}}
hash_head=0;if(s.lookahead>=MIN_MATCH){s.ins_h=((s.ins_h<<s.hash_shift)^s.window[s.strstart+MIN_MATCH-1])&s.hash_mask;hash_head=s.prev[s.strstart&s.w_mask]=s.head[s.ins_h];s.head[s.ins_h]=s.strstart;}
s.prev_length=s.match_length;s.prev_match=s.match_start;s.match_length=MIN_MATCH-1;if(hash_head!==0&&s.prev_length<s.max_lazy_match&&s.strstart-hash_head<=(s.w_size-MIN_LOOKAHEAD)){s.match_length=longest_match(s,hash_head);if(s.match_length<=5&&(s.strategy===Z_FILTERED||(s.match_length===MIN_MATCH&&s.strstart-s.match_start>4096))){s.match_length=MIN_MATCH-1;}}
if(s.prev_length>=MIN_MATCH&&s.match_length<=s.prev_length){max_insert=s.strstart+s.lookahead-MIN_MATCH;bflush=trees._tr_tally(s,s.strstart-1-s.prev_match,s.prev_length-MIN_MATCH);s.lookahead-=s.prev_length-1;s.prev_length-=2;do{if(++s.strstart<=max_insert){s.ins_h=((s.ins_h<<s.hash_shift)^s.window[s.strstart+MIN_MATCH-1])&s.hash_mask;hash_head=s.prev[s.strstart&s.w_mask]=s.head[s.ins_h];s.head[s.ins_h]=s.strstart;}}while(--s.prev_length!==0);s.match_available=0;s.match_length=MIN_MATCH-1;s.strstart++;if(bflush){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}}else if(s.match_available){bflush=trees._tr_tally(s,0,s.window[s.strstart-1]);if(bflush){flush_block_only(s,false);}
s.strstart++;s.lookahead--;if(s.strm.avail_out===0){return BS_NEED_MORE;}}else{s.match_available=1;s.strstart++;s.lookahead--;}}
if(s.match_available){bflush=trees._tr_tally(s,0,s.window[s.strstart-1]);s.match_available=0;}
s.insert=s.strstart<MIN_MATCH-1?s.strstart:MIN_MATCH-1;if(flush===Z_FINISH){flush_block_only(s,true);if(s.strm.avail_out===0){return BS_FINISH_STARTED;}
return BS_FINISH_DONE;}
if(s.last_lit){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}
return BS_BLOCK_DONE;}
function deflate_rle(s,flush){var bflush;var prev;var scan,strend;var _win=s.window;for(;;){if(s.lookahead<=MAX_MATCH){fill_window(s);if(s.lookahead<=MAX_MATCH&&flush===Z_NO_FLUSH){return BS_NEED_MORE;}
if(s.lookahead===0){break;}}
s.match_length=0;if(s.lookahead>=MIN_MATCH&&s.strstart>0){scan=s.strstart-1;prev=_win[scan];if(prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]){strend=s.strstart+MAX_MATCH;do{}while(prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]&&prev===_win[++scan]&&scan<strend);s.match_length=MAX_MATCH-(strend-scan);if(s.match_length>s.lookahead){s.match_length=s.lookahead;}}}
if(s.match_length>=MIN_MATCH){bflush=trees._tr_tally(s,1,s.match_length-MIN_MATCH);s.lookahead-=s.match_length;s.strstart+=s.match_length;s.match_length=0;}else{bflush=trees._tr_tally(s,0,s.window[s.strstart]);s.lookahead--;s.strstart++;}
if(bflush){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}}
s.insert=0;if(flush===Z_FINISH){flush_block_only(s,true);if(s.strm.avail_out===0){return BS_FINISH_STARTED;}
return BS_FINISH_DONE;}
if(s.last_lit){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}
return BS_BLOCK_DONE;}
function deflate_huff(s,flush){var bflush;for(;;){if(s.lookahead===0){fill_window(s);if(s.lookahead===0){if(flush===Z_NO_FLUSH){return BS_NEED_MORE;}
break;}}
s.match_length=0;bflush=trees._tr_tally(s,0,s.window[s.strstart]);s.lookahead--;s.strstart++;if(bflush){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}}
s.insert=0;if(flush===Z_FINISH){flush_block_only(s,true);if(s.strm.avail_out===0){return BS_FINISH_STARTED;}
return BS_FINISH_DONE;}
if(s.last_lit){flush_block_only(s,false);if(s.strm.avail_out===0){return BS_NEED_MORE;}}
return BS_BLOCK_DONE;}
function Config(good_length,max_lazy,nice_length,max_chain,func){this.good_length=good_length;this.max_lazy=max_lazy;this.nice_length=nice_length;this.max_chain=max_chain;this.func=func;}
var configuration_table;configuration_table=[new Config(0,0,0,0,deflate_stored),new Config(4,4,8,4,deflate_fast),new Config(4,5,16,8,deflate_fast),new Config(4,6,32,32,deflate_fast),new Config(4,4,16,16,deflate_slow),new Config(8,16,32,32,deflate_slow),new Config(8,16,128,128,deflate_slow),new Config(8,32,128,256,deflate_slow),new Config(32,128,258,1024,deflate_slow),new Config(32,258,258,4096,deflate_slow)];function lm_init(s){s.window_size=2*s.w_size;zero(s.head);s.max_lazy_match=configuration_table[s.level].max_lazy;s.good_match=configuration_table[s.level].good_length;s.nice_match=configuration_table[s.level].nice_length;s.max_chain_length=configuration_table[s.level].max_chain;s.strstart=0;s.block_start=0;s.lookahead=0;s.insert=0;s.match_length=s.prev_length=MIN_MATCH-1;s.match_available=0;s.ins_h=0;}
function DeflateState(){this.strm=null;this.status=0;this.pending_buf=null;this.pending_buf_size=0;this.pending_out=0;this.pending=0;this.wrap=0;this.gzhead=null;this.gzindex=0;this.method=Z_DEFLATED;this.last_flush=-1;this.w_size=0;this.w_bits=0;this.w_mask=0;this.window=null;this.window_size=0;this.prev=null;this.head=null;this.ins_h=0;this.hash_size=0;this.hash_bits=0;this.hash_mask=0;this.hash_shift=0;this.block_start=0;this.match_length=0;this.prev_match=0;this.match_available=0;this.strstart=0;this.match_start=0;this.lookahead=0;this.prev_length=0;this.max_chain_length=0;this.max_lazy_match=0;this.level=0;this.strategy=0;this.good_match=0;this.nice_match=0;this.dyn_ltree=new utils.Buf16(HEAP_SIZE*2);this.dyn_dtree=new utils.Buf16((2*D_CODES+1)*2);this.bl_tree=new utils.Buf16((2*BL_CODES+1)*2);zero(this.dyn_ltree);zero(this.dyn_dtree);zero(this.bl_tree);this.l_desc=null;this.d_desc=null;this.bl_desc=null;this.bl_count=new utils.Buf16(MAX_BITS+1);this.heap=new utils.Buf16(2*L_CODES+1);zero(this.heap);this.heap_len=0;this.heap_max=0;this.depth=new utils.Buf16(2*L_CODES+1);zero(this.depth);this.l_buf=0;this.lit_bufsize=0;this.last_lit=0;this.d_buf=0;this.opt_len=0;this.static_len=0;this.matches=0;this.insert=0;this.bi_buf=0;this.bi_valid=0;}
function deflateResetKeep(strm){var s;if(!strm||!strm.state){return err(strm,Z_STREAM_ERROR);}
strm.total_in=strm.total_out=0;strm.data_type=Z_UNKNOWN;s=strm.state;s.pending=0;s.pending_out=0;if(s.wrap<0){s.wrap=-s.wrap;}
s.status=(s.wrap?INIT_STATE:BUSY_STATE);strm.adler=(s.wrap===2)?0:1;s.last_flush=Z_NO_FLUSH;trees._tr_init(s);return Z_OK;}
function deflateReset(strm){var ret=deflateResetKeep(strm);if(ret===Z_OK){lm_init(strm.state);}
return ret;}
function deflateSetHeader(strm,head){if(!strm||!strm.state){return Z_STREAM_ERROR;}
if(strm.state.wrap!==2){return Z_STREAM_ERROR;}
strm.state.gzhead=head;return Z_OK;}
function deflateInit2(strm,level,method,windowBits,memLevel,strategy){if(!strm){return Z_STREAM_ERROR;}
var wrap=1;if(level===Z_DEFAULT_COMPRESSION){level=6;}
if(windowBits<0){wrap=0;windowBits=-windowBits;}
else if(windowBits>15){wrap=2;windowBits-=16;}
if(memLevel<1||memLevel>MAX_MEM_LEVEL||method!==Z_DEFLATED||windowBits<8||windowBits>15||level<0||level>9||strategy<0||strategy>Z_FIXED){return err(strm,Z_STREAM_ERROR);}
if(windowBits===8){windowBits=9;}
var s=new DeflateState();strm.state=s;s.strm=strm;s.wrap=wrap;s.gzhead=null;s.w_bits=windowBits;s.w_size=1<<s.w_bits;s.w_mask=s.w_size-1;s.hash_bits=memLevel+7;s.hash_size=1<<s.hash_bits;s.hash_mask=s.hash_size-1;s.hash_shift=~~((s.hash_bits+MIN_MATCH-1)/MIN_MATCH);s.window=new utils.Buf8(s.w_size*2);s.head=new utils.Buf16(s.hash_size);s.prev=new utils.Buf16(s.w_size);s.lit_bufsize=1<<(memLevel+6);s.pending_buf_size=s.lit_bufsize*4;s.pending_buf=new utils.Buf8(s.pending_buf_size);s.d_buf=1*s.lit_bufsize;s.l_buf=(1+2)*s.lit_bufsize;s.level=level;s.strategy=strategy;s.method=method;return deflateReset(strm);}
function deflateInit(strm,level){return deflateInit2(strm,level,Z_DEFLATED,MAX_WBITS,DEF_MEM_LEVEL,Z_DEFAULT_STRATEGY);}
function deflate(strm,flush){var old_flush,s;var beg,val;if(!strm||!strm.state||flush>Z_BLOCK||flush<0){return strm?err(strm,Z_STREAM_ERROR):Z_STREAM_ERROR;}
s=strm.state;if(!strm.output||(!strm.input&&strm.avail_in!==0)||(s.status===FINISH_STATE&&flush!==Z_FINISH)){return err(strm,(strm.avail_out===0)?Z_BUF_ERROR:Z_STREAM_ERROR);}
s.strm=strm;old_flush=s.last_flush;s.last_flush=flush;if(s.status===INIT_STATE){if(s.wrap===2){strm.adler=0;put_byte(s,31);put_byte(s,139);put_byte(s,8);if(!s.gzhead){put_byte(s,0);put_byte(s,0);put_byte(s,0);put_byte(s,0);put_byte(s,0);put_byte(s,s.level===9?2:(s.strategy>=Z_HUFFMAN_ONLY||s.level<2?4:0));put_byte(s,OS_CODE);s.status=BUSY_STATE;}
else{put_byte(s,(s.gzhead.text?1:0)+
(s.gzhead.hcrc?2:0)+
(!s.gzhead.extra?0:4)+
(!s.gzhead.name?0:8)+
(!s.gzhead.comment?0:16));put_byte(s,s.gzhead.time&0xff);put_byte(s,(s.gzhead.time>>8)&0xff);put_byte(s,(s.gzhead.time>>16)&0xff);put_byte(s,(s.gzhead.time>>24)&0xff);put_byte(s,s.level===9?2:(s.strategy>=Z_HUFFMAN_ONLY||s.level<2?4:0));put_byte(s,s.gzhead.os&0xff);if(s.gzhead.extra&&s.gzhead.extra.length){put_byte(s,s.gzhead.extra.length&0xff);put_byte(s,(s.gzhead.extra.length>>8)&0xff);}
if(s.gzhead.hcrc){strm.adler=crc32(strm.adler,s.pending_buf,s.pending,0);}
s.gzindex=0;s.status=EXTRA_STATE;}}
else
{var header=(Z_DEFLATED+((s.w_bits-8)<<4))<<8;var level_flags=-1;if(s.strategy>=Z_HUFFMAN_ONLY||s.level<2){level_flags=0;}else if(s.level<6){level_flags=1;}else if(s.level===6){level_flags=2;}else{level_flags=3;}
header|=(level_flags<<6);if(s.strstart!==0){header|=PRESET_DICT;}
header+=31-(header%31);s.status=BUSY_STATE;putShortMSB(s,header);if(s.strstart!==0){putShortMSB(s,strm.adler>>>16);putShortMSB(s,strm.adler&0xffff);}
strm.adler=1;}}
if(s.status===EXTRA_STATE){if(s.gzhead.extra){beg=s.pending;while(s.gzindex<(s.gzhead.extra.length&0xffff)){if(s.pending===s.pending_buf_size){if(s.gzhead.hcrc&&s.pending>beg){strm.adler=crc32(strm.adler,s.pending_buf,s.pending-beg,beg);}
flush_pending(strm);beg=s.pending;if(s.pending===s.pending_buf_size){break;}}
put_byte(s,s.gzhead.extra[s.gzindex]&0xff);s.gzindex++;}
if(s.gzhead.hcrc&&s.pending>beg){strm.adler=crc32(strm.adler,s.pending_buf,s.pending-beg,beg);}
if(s.gzindex===s.gzhead.extra.length){s.gzindex=0;s.status=NAME_STATE;}}
else{s.status=NAME_STATE;}}
if(s.status===NAME_STATE){if(s.gzhead.name){beg=s.pending;do{if(s.pending===s.pending_buf_size){if(s.gzhead.hcrc&&s.pending>beg){strm.adler=crc32(strm.adler,s.pending_buf,s.pending-beg,beg);}
flush_pending(strm);beg=s.pending;if(s.pending===s.pending_buf_size){val=1;break;}}
if(s.gzindex<s.gzhead.name.length){val=s.gzhead.name.charCodeAt(s.gzindex++)&0xff;}else{val=0;}
put_byte(s,val);}while(val!==0);if(s.gzhead.hcrc&&s.pending>beg){strm.adler=crc32(strm.adler,s.pending_buf,s.pending-beg,beg);}
if(val===0){s.gzindex=0;s.status=COMMENT_STATE;}}
else{s.status=COMMENT_STATE;}}
if(s.status===COMMENT_STATE){if(s.gzhead.comment){beg=s.pending;do{if(s.pending===s.pending_buf_size){if(s.gzhead.hcrc&&s.pending>beg){strm.adler=crc32(strm.adler,s.pending_buf,s.pending-beg,beg);}
flush_pending(strm);beg=s.pending;if(s.pending===s.pending_buf_size){val=1;break;}}
if(s.gzindex<s.gzhead.comment.length){val=s.gzhead.comment.charCodeAt(s.gzindex++)&0xff;}else{val=0;}
put_byte(s,val);}while(val!==0);if(s.gzhead.hcrc&&s.pending>beg){strm.adler=crc32(strm.adler,s.pending_buf,s.pending-beg,beg);}
if(val===0){s.status=HCRC_STATE;}}
else{s.status=HCRC_STATE;}}
if(s.status===HCRC_STATE){if(s.gzhead.hcrc){if(s.pending+2>s.pending_buf_size){flush_pending(strm);}
if(s.pending+2<=s.pending_buf_size){put_byte(s,strm.adler&0xff);put_byte(s,(strm.adler>>8)&0xff);strm.adler=0;s.status=BUSY_STATE;}}
else{s.status=BUSY_STATE;}}
if(s.pending!==0){flush_pending(strm);if(strm.avail_out===0){s.last_flush=-1;return Z_OK;}}else if(strm.avail_in===0&&rank(flush)<=rank(old_flush)&&flush!==Z_FINISH){return err(strm,Z_BUF_ERROR);}
if(s.status===FINISH_STATE&&strm.avail_in!==0){return err(strm,Z_BUF_ERROR);}
if(strm.avail_in!==0||s.lookahead!==0||(flush!==Z_NO_FLUSH&&s.status!==FINISH_STATE)){var bstate=(s.strategy===Z_HUFFMAN_ONLY)?deflate_huff(s,flush):(s.strategy===Z_RLE?deflate_rle(s,flush):configuration_table[s.level].func(s,flush));if(bstate===BS_FINISH_STARTED||bstate===BS_FINISH_DONE){s.status=FINISH_STATE;}
if(bstate===BS_NEED_MORE||bstate===BS_FINISH_STARTED){if(strm.avail_out===0){s.last_flush=-1;}
return Z_OK;}
if(bstate===BS_BLOCK_DONE){if(flush===Z_PARTIAL_FLUSH){trees._tr_align(s);}
else if(flush!==Z_BLOCK){trees._tr_stored_block(s,0,0,false);if(flush===Z_FULL_FLUSH){zero(s.head);if(s.lookahead===0){s.strstart=0;s.block_start=0;s.insert=0;}}}
flush_pending(strm);if(strm.avail_out===0){s.last_flush=-1;return Z_OK;}}}
if(flush!==Z_FINISH){return Z_OK;}
if(s.wrap<=0){return Z_STREAM_END;}
if(s.wrap===2){put_byte(s,strm.adler&0xff);put_byte(s,(strm.adler>>8)&0xff);put_byte(s,(strm.adler>>16)&0xff);put_byte(s,(strm.adler>>24)&0xff);put_byte(s,strm.total_in&0xff);put_byte(s,(strm.total_in>>8)&0xff);put_byte(s,(strm.total_in>>16)&0xff);put_byte(s,(strm.total_in>>24)&0xff);}
else
{putShortMSB(s,strm.adler>>>16);putShortMSB(s,strm.adler&0xffff);}
flush_pending(strm);if(s.wrap>0){s.wrap=-s.wrap;}
return s.pending!==0?Z_OK:Z_STREAM_END;}
function deflateEnd(strm){var status;if(!strm||!strm.state){return Z_STREAM_ERROR;}
status=strm.state.status;if(status!==INIT_STATE&&status!==EXTRA_STATE&&status!==NAME_STATE&&status!==COMMENT_STATE&&status!==HCRC_STATE&&status!==BUSY_STATE&&status!==FINISH_STATE){return err(strm,Z_STREAM_ERROR);}
strm.state=null;return status===BUSY_STATE?err(strm,Z_DATA_ERROR):Z_OK;}
function deflateSetDictionary(strm,dictionary){var dictLength=dictionary.length;var s;var str,n;var wrap;var avail;var next;var input;var tmpDict;if(!strm||!strm.state){return Z_STREAM_ERROR;}
s=strm.state;wrap=s.wrap;if(wrap===2||(wrap===1&&s.status!==INIT_STATE)||s.lookahead){return Z_STREAM_ERROR;}
if(wrap===1){strm.adler=adler32(strm.adler,dictionary,dictLength,0);}
s.wrap=0;if(dictLength>=s.w_size){if(wrap===0){zero(s.head);s.strstart=0;s.block_start=0;s.insert=0;}
tmpDict=new utils.Buf8(s.w_size);utils.arraySet(tmpDict,dictionary,dictLength-s.w_size,s.w_size,0);dictionary=tmpDict;dictLength=s.w_size;}
avail=strm.avail_in;next=strm.next_in;input=strm.input;strm.avail_in=dictLength;strm.next_in=0;strm.input=dictionary;fill_window(s);while(s.lookahead>=MIN_MATCH){str=s.strstart;n=s.lookahead-(MIN_MATCH-1);do{s.ins_h=((s.ins_h<<s.hash_shift)^s.window[str+MIN_MATCH-1])&s.hash_mask;s.prev[str&s.w_mask]=s.head[s.ins_h];s.head[s.ins_h]=str;str++;}while(--n);s.strstart=str;s.lookahead=MIN_MATCH-1;fill_window(s);}
s.strstart+=s.lookahead;s.block_start=s.strstart;s.insert=s.lookahead;s.lookahead=0;s.match_length=s.prev_length=MIN_MATCH-1;s.match_available=0;strm.next_in=next;strm.input=input;strm.avail_in=avail;s.wrap=wrap;return Z_OK;}
exports.deflateInit=deflateInit;exports.deflateInit2=deflateInit2;exports.deflateReset=deflateReset;exports.deflateResetKeep=deflateResetKeep;exports.deflateSetHeader=deflateSetHeader;exports.deflate=deflate;exports.deflateEnd=deflateEnd;exports.deflateSetDictionary=deflateSetDictionary;exports.deflateInfo='pako deflate (from Nodeca project)';},{"../utils/common":123,"./adler32":125,"./crc32":127,"./messages":133,"./trees":134}],129:[function(require,module,exports){'use strict';function GZheader(){this.text=0;this.time=0;this.xflags=0;this.os=0;this.extra=null;this.extra_len=0;this.name='';this.comment='';this.hcrc=0;this.done=false;}
module.exports=GZheader;},{}],130:[function(require,module,exports){'use strict';var BAD=30;var TYPE=12;module.exports=function inflate_fast(strm,start){var state;var _in;var last;var _out;var beg;var end;var dmax;var wsize;var whave;var wnext;var s_window;var hold;var bits;var lcode;var dcode;var lmask;var dmask;var here;var op;var len;var dist;var from;var from_source;var input,output;state=strm.state;_in=strm.next_in;input=strm.input;last=_in+(strm.avail_in-5);_out=strm.next_out;output=strm.output;beg=_out-(start-strm.avail_out);end=_out+(strm.avail_out-257);dmax=state.dmax;wsize=state.wsize;whave=state.whave;wnext=state.wnext;s_window=state.window;hold=state.hold;bits=state.bits;lcode=state.lencode;dcode=state.distcode;lmask=(1<<state.lenbits)-1;dmask=(1<<state.distbits)-1;top:do{if(bits<15){hold+=input[_in++]<<bits;bits+=8;hold+=input[_in++]<<bits;bits+=8;}
here=lcode[hold&lmask];dolen:for(;;){op=here>>>24;hold>>>=op;bits-=op;op=(here>>>16)&0xff;if(op===0){output[_out++]=here&0xffff;}
else if(op&16){len=here&0xffff;op&=15;if(op){if(bits<op){hold+=input[_in++]<<bits;bits+=8;}
len+=hold&((1<<op)-1);hold>>>=op;bits-=op;}
if(bits<15){hold+=input[_in++]<<bits;bits+=8;hold+=input[_in++]<<bits;bits+=8;}
here=dcode[hold&dmask];dodist:for(;;){op=here>>>24;hold>>>=op;bits-=op;op=(here>>>16)&0xff;if(op&16){dist=here&0xffff;op&=15;if(bits<op){hold+=input[_in++]<<bits;bits+=8;if(bits<op){hold+=input[_in++]<<bits;bits+=8;}}
dist+=hold&((1<<op)-1);if(dist>dmax){strm.msg='invalid distance too far back';state.mode=BAD;break top;}
hold>>>=op;bits-=op;op=_out-beg;if(dist>op){op=dist-op;if(op>whave){if(state.sane){strm.msg='invalid distance too far back';state.mode=BAD;break top;}}
from=0;from_source=s_window;if(wnext===0){from+=wsize-op;if(op<len){len-=op;do{output[_out++]=s_window[from++];}while(--op);from=_out-dist;from_source=output;}}
else if(wnext<op){from+=wsize+wnext-op;op-=wnext;if(op<len){len-=op;do{output[_out++]=s_window[from++];}while(--op);from=0;if(wnext<len){op=wnext;len-=op;do{output[_out++]=s_window[from++];}while(--op);from=_out-dist;from_source=output;}}}
else{from+=wnext-op;if(op<len){len-=op;do{output[_out++]=s_window[from++];}while(--op);from=_out-dist;from_source=output;}}
while(len>2){output[_out++]=from_source[from++];output[_out++]=from_source[from++];output[_out++]=from_source[from++];len-=3;}
if(len){output[_out++]=from_source[from++];if(len>1){output[_out++]=from_source[from++];}}}
else{from=_out-dist;do{output[_out++]=output[from++];output[_out++]=output[from++];output[_out++]=output[from++];len-=3;}while(len>2);if(len){output[_out++]=output[from++];if(len>1){output[_out++]=output[from++];}}}}
else if((op&64)===0){here=dcode[(here&0xffff)+(hold&((1<<op)-1))];continue dodist;}
else{strm.msg='invalid distance code';state.mode=BAD;break top;}
break;}}
else if((op&64)===0){here=lcode[(here&0xffff)+(hold&((1<<op)-1))];continue dolen;}
else if(op&32){state.mode=TYPE;break top;}
else{strm.msg='invalid literal/length code';state.mode=BAD;break top;}
break;}}while(_in<last&&_out<end);len=bits>>3;_in-=len;bits-=len<<3;hold&=(1<<bits)-1;strm.next_in=_in;strm.next_out=_out;strm.avail_in=(_in<last?5+(last-_in):5-(_in-last));strm.avail_out=(_out<end?257+(end-_out):257-(_out-end));state.hold=hold;state.bits=bits;return;};},{}],131:[function(require,module,exports){'use strict';var utils=require('../utils/common');var adler32=require('./adler32');var crc32=require('./crc32');var inflate_fast=require('./inffast');var inflate_table=require('./inftrees');var CODES=0;var LENS=1;var DISTS=2;var Z_FINISH=4;var Z_BLOCK=5;var Z_TREES=6;var Z_OK=0;var Z_STREAM_END=1;var Z_NEED_DICT=2;var Z_STREAM_ERROR=-2;var Z_DATA_ERROR=-3;var Z_MEM_ERROR=-4;var Z_BUF_ERROR=-5;var Z_DEFLATED=8;var HEAD=1;var FLAGS=2;var TIME=3;var OS=4;var EXLEN=5;var EXTRA=6;var NAME=7;var COMMENT=8;var HCRC=9;var DICTID=10;var DICT=11;var TYPE=12;var TYPEDO=13;var STORED=14;var COPY_=15;var COPY=16;var TABLE=17;var LENLENS=18;var CODELENS=19;var LEN_=20;var LEN=21;var LENEXT=22;var DIST=23;var DISTEXT=24;var MATCH=25;var LIT=26;var CHECK=27;var LENGTH=28;var DONE=29;var BAD=30;var MEM=31;var SYNC=32;var ENOUGH_LENS=852;var ENOUGH_DISTS=592;var MAX_WBITS=15;var DEF_WBITS=MAX_WBITS;function zswap32(q){return(((q>>>24)&0xff)+
((q>>>8)&0xff00)+
((q&0xff00)<<8)+
((q&0xff)<<24));}
function InflateState(){this.mode=0;this.last=false;this.wrap=0;this.havedict=false;this.flags=0;this.dmax=0;this.check=0;this.total=0;this.head=null;this.wbits=0;this.wsize=0;this.whave=0;this.wnext=0;this.window=null;this.hold=0;this.bits=0;this.length=0;this.offset=0;this.extra=0;this.lencode=null;this.distcode=null;this.lenbits=0;this.distbits=0;this.ncode=0;this.nlen=0;this.ndist=0;this.have=0;this.next=null;this.lens=new utils.Buf16(320);this.work=new utils.Buf16(288);this.lendyn=null;this.distdyn=null;this.sane=0;this.back=0;this.was=0;}
function inflateResetKeep(strm){var state;if(!strm||!strm.state){return Z_STREAM_ERROR;}
state=strm.state;strm.total_in=strm.total_out=state.total=0;strm.msg='';if(state.wrap){strm.adler=state.wrap&1;}
state.mode=HEAD;state.last=0;state.havedict=0;state.dmax=32768;state.head=null;state.hold=0;state.bits=0;state.lencode=state.lendyn=new utils.Buf32(ENOUGH_LENS);state.distcode=state.distdyn=new utils.Buf32(ENOUGH_DISTS);state.sane=1;state.back=-1;return Z_OK;}
function inflateReset(strm){var state;if(!strm||!strm.state){return Z_STREAM_ERROR;}
state=strm.state;state.wsize=0;state.whave=0;state.wnext=0;return inflateResetKeep(strm);}
function inflateReset2(strm,windowBits){var wrap;var state;if(!strm||!strm.state){return Z_STREAM_ERROR;}
state=strm.state;if(windowBits<0){wrap=0;windowBits=-windowBits;}
else{wrap=(windowBits>>4)+1;if(windowBits<48){windowBits&=15;}}
if(windowBits&&(windowBits<8||windowBits>15)){return Z_STREAM_ERROR;}
if(state.window!==null&&state.wbits!==windowBits){state.window=null;}
state.wrap=wrap;state.wbits=windowBits;return inflateReset(strm);}
function inflateInit2(strm,windowBits){var ret;var state;if(!strm){return Z_STREAM_ERROR;}
state=new InflateState();strm.state=state;state.window=null;ret=inflateReset2(strm,windowBits);if(ret!==Z_OK){strm.state=null;}
return ret;}
function inflateInit(strm){return inflateInit2(strm,DEF_WBITS);}
var virgin=true;var lenfix,distfix;function fixedtables(state){if(virgin){var sym;lenfix=new utils.Buf32(512);distfix=new utils.Buf32(32);sym=0;while(sym<144){state.lens[sym++]=8;}
while(sym<256){state.lens[sym++]=9;}
while(sym<280){state.lens[sym++]=7;}
while(sym<288){state.lens[sym++]=8;}
inflate_table(LENS,state.lens,0,288,lenfix,0,state.work,{bits:9});sym=0;while(sym<32){state.lens[sym++]=5;}
inflate_table(DISTS,state.lens,0,32,distfix,0,state.work,{bits:5});virgin=false;}
state.lencode=lenfix;state.lenbits=9;state.distcode=distfix;state.distbits=5;}
function updatewindow(strm,src,end,copy){var dist;var state=strm.state;if(state.window===null){state.wsize=1<<state.wbits;state.wnext=0;state.whave=0;state.window=new utils.Buf8(state.wsize);}
if(copy>=state.wsize){utils.arraySet(state.window,src,end-state.wsize,state.wsize,0);state.wnext=0;state.whave=state.wsize;}
else{dist=state.wsize-state.wnext;if(dist>copy){dist=copy;}
utils.arraySet(state.window,src,end-copy,dist,state.wnext);copy-=dist;if(copy){utils.arraySet(state.window,src,end-copy,copy,0);state.wnext=copy;state.whave=state.wsize;}
else{state.wnext+=dist;if(state.wnext===state.wsize){state.wnext=0;}
if(state.whave<state.wsize){state.whave+=dist;}}}
return 0;}
function inflate(strm,flush){var state;var input,output;var next;var put;var have,left;var hold;var bits;var _in,_out;var copy;var from;var from_source;var here=0;var here_bits,here_op,here_val;var last_bits,last_op,last_val;var len;var ret;var hbuf=new utils.Buf8(4);var opts;var n;var order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!strm||!strm.state||!strm.output||(!strm.input&&strm.avail_in!==0)){return Z_STREAM_ERROR;}
state=strm.state;if(state.mode===TYPE){state.mode=TYPEDO;}
put=strm.next_out;output=strm.output;left=strm.avail_out;next=strm.next_in;input=strm.input;have=strm.avail_in;hold=state.hold;bits=state.bits;_in=have;_out=left;ret=Z_OK;inf_leave:for(;;){switch(state.mode){case HEAD:if(state.wrap===0){state.mode=TYPEDO;break;}
while(bits<16){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if((state.wrap&2)&&hold===0x8b1f){state.check=0;hbuf[0]=hold&0xff;hbuf[1]=(hold>>>8)&0xff;state.check=crc32(state.check,hbuf,2,0);hold=0;bits=0;state.mode=FLAGS;break;}
state.flags=0;if(state.head){state.head.done=false;}
if(!(state.wrap&1)||(((hold&0xff)<<8)+(hold>>8))%31){strm.msg='incorrect header check';state.mode=BAD;break;}
if((hold&0x0f)!==Z_DEFLATED){strm.msg='unknown compression method';state.mode=BAD;break;}
hold>>>=4;bits-=4;len=(hold&0x0f)+8;if(state.wbits===0){state.wbits=len;}
else if(len>state.wbits){strm.msg='invalid window size';state.mode=BAD;break;}
state.dmax=1<<len;strm.adler=state.check=1;state.mode=hold&0x200?DICTID:TYPE;hold=0;bits=0;break;case FLAGS:while(bits<16){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.flags=hold;if((state.flags&0xff)!==Z_DEFLATED){strm.msg='unknown compression method';state.mode=BAD;break;}
if(state.flags&0xe000){strm.msg='unknown header flags set';state.mode=BAD;break;}
if(state.head){state.head.text=((hold>>8)&1);}
if(state.flags&0x0200){hbuf[0]=hold&0xff;hbuf[1]=(hold>>>8)&0xff;state.check=crc32(state.check,hbuf,2,0);}
hold=0;bits=0;state.mode=TIME;case TIME:while(bits<32){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if(state.head){state.head.time=hold;}
if(state.flags&0x0200){hbuf[0]=hold&0xff;hbuf[1]=(hold>>>8)&0xff;hbuf[2]=(hold>>>16)&0xff;hbuf[3]=(hold>>>24)&0xff;state.check=crc32(state.check,hbuf,4,0);}
hold=0;bits=0;state.mode=OS;case OS:while(bits<16){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if(state.head){state.head.xflags=(hold&0xff);state.head.os=(hold>>8);}
if(state.flags&0x0200){hbuf[0]=hold&0xff;hbuf[1]=(hold>>>8)&0xff;state.check=crc32(state.check,hbuf,2,0);}
hold=0;bits=0;state.mode=EXLEN;case EXLEN:if(state.flags&0x0400){while(bits<16){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.length=hold;if(state.head){state.head.extra_len=hold;}
if(state.flags&0x0200){hbuf[0]=hold&0xff;hbuf[1]=(hold>>>8)&0xff;state.check=crc32(state.check,hbuf,2,0);}
hold=0;bits=0;}
else if(state.head){state.head.extra=null;}
state.mode=EXTRA;case EXTRA:if(state.flags&0x0400){copy=state.length;if(copy>have){copy=have;}
if(copy){if(state.head){len=state.head.extra_len-state.length;if(!state.head.extra){state.head.extra=new Array(state.head.extra_len);}
utils.arraySet(state.head.extra,input,next,copy,len);}
if(state.flags&0x0200){state.check=crc32(state.check,input,copy,next);}
have-=copy;next+=copy;state.length-=copy;}
if(state.length){break inf_leave;}}
state.length=0;state.mode=NAME;case NAME:if(state.flags&0x0800){if(have===0){break inf_leave;}
copy=0;do{len=input[next+copy++];if(state.head&&len&&(state.length<65536)){state.head.name+=String.fromCharCode(len);}}while(len&&copy<have);if(state.flags&0x0200){state.check=crc32(state.check,input,copy,next);}
have-=copy;next+=copy;if(len){break inf_leave;}}
else if(state.head){state.head.name=null;}
state.length=0;state.mode=COMMENT;case COMMENT:if(state.flags&0x1000){if(have===0){break inf_leave;}
copy=0;do{len=input[next+copy++];if(state.head&&len&&(state.length<65536)){state.head.comment+=String.fromCharCode(len);}}while(len&&copy<have);if(state.flags&0x0200){state.check=crc32(state.check,input,copy,next);}
have-=copy;next+=copy;if(len){break inf_leave;}}
else if(state.head){state.head.comment=null;}
state.mode=HCRC;case HCRC:if(state.flags&0x0200){while(bits<16){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if(hold!==(state.check&0xffff)){strm.msg='header crc mismatch';state.mode=BAD;break;}
hold=0;bits=0;}
if(state.head){state.head.hcrc=((state.flags>>9)&1);state.head.done=true;}
strm.adler=state.check=0;state.mode=TYPE;break;case DICTID:while(bits<32){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
strm.adler=state.check=zswap32(hold);hold=0;bits=0;state.mode=DICT;case DICT:if(state.havedict===0){strm.next_out=put;strm.avail_out=left;strm.next_in=next;strm.avail_in=have;state.hold=hold;state.bits=bits;return Z_NEED_DICT;}
strm.adler=state.check=1;state.mode=TYPE;case TYPE:if(flush===Z_BLOCK||flush===Z_TREES){break inf_leave;}
case TYPEDO:if(state.last){hold>>>=bits&7;bits-=bits&7;state.mode=CHECK;break;}
while(bits<3){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.last=(hold&0x01);hold>>>=1;bits-=1;switch((hold&0x03)){case 0:state.mode=STORED;break;case 1:fixedtables(state);state.mode=LEN_;if(flush===Z_TREES){hold>>>=2;bits-=2;break inf_leave;}
break;case 2:state.mode=TABLE;break;case 3:strm.msg='invalid block type';state.mode=BAD;}
hold>>>=2;bits-=2;break;case STORED:hold>>>=bits&7;bits-=bits&7;while(bits<32){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if((hold&0xffff)!==((hold>>>16)^0xffff)){strm.msg='invalid stored block lengths';state.mode=BAD;break;}
state.length=hold&0xffff;hold=0;bits=0;state.mode=COPY_;if(flush===Z_TREES){break inf_leave;}
case COPY_:state.mode=COPY;case COPY:copy=state.length;if(copy){if(copy>have){copy=have;}
if(copy>left){copy=left;}
if(copy===0){break inf_leave;}
utils.arraySet(output,input,next,copy,put);have-=copy;next+=copy;left-=copy;put+=copy;state.length-=copy;break;}
state.mode=TYPE;break;case TABLE:while(bits<14){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.nlen=(hold&0x1f)+257;hold>>>=5;bits-=5;state.ndist=(hold&0x1f)+1;hold>>>=5;bits-=5;state.ncode=(hold&0x0f)+4;hold>>>=4;bits-=4;if(state.nlen>286||state.ndist>30){strm.msg='too many length or distance symbols';state.mode=BAD;break;}
state.have=0;state.mode=LENLENS;case LENLENS:while(state.have<state.ncode){while(bits<3){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.lens[order[state.have++]]=(hold&0x07);hold>>>=3;bits-=3;}
while(state.have<19){state.lens[order[state.have++]]=0;}
state.lencode=state.lendyn;state.lenbits=7;opts={bits:state.lenbits};ret=inflate_table(CODES,state.lens,0,19,state.lencode,0,state.work,opts);state.lenbits=opts.bits;if(ret){strm.msg='invalid code lengths set';state.mode=BAD;break;}
state.have=0;state.mode=CODELENS;case CODELENS:while(state.have<state.nlen+state.ndist){for(;;){here=state.lencode[hold&((1<<state.lenbits)-1)];here_bits=here>>>24;here_op=(here>>>16)&0xff;here_val=here&0xffff;if((here_bits)<=bits){break;}
if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if(here_val<16){hold>>>=here_bits;bits-=here_bits;state.lens[state.have++]=here_val;}
else{if(here_val===16){n=here_bits+2;while(bits<n){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
hold>>>=here_bits;bits-=here_bits;if(state.have===0){strm.msg='invalid bit length repeat';state.mode=BAD;break;}
len=state.lens[state.have-1];copy=3+(hold&0x03);hold>>>=2;bits-=2;}
else if(here_val===17){n=here_bits+3;while(bits<n){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
hold>>>=here_bits;bits-=here_bits;len=0;copy=3+(hold&0x07);hold>>>=3;bits-=3;}
else{n=here_bits+7;while(bits<n){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
hold>>>=here_bits;bits-=here_bits;len=0;copy=11+(hold&0x7f);hold>>>=7;bits-=7;}
if(state.have+copy>state.nlen+state.ndist){strm.msg='invalid bit length repeat';state.mode=BAD;break;}
while(copy--){state.lens[state.have++]=len;}}}
if(state.mode===BAD){break;}
if(state.lens[256]===0){strm.msg='invalid code -- missing end-of-block';state.mode=BAD;break;}
state.lenbits=9;opts={bits:state.lenbits};ret=inflate_table(LENS,state.lens,0,state.nlen,state.lencode,0,state.work,opts);state.lenbits=opts.bits;if(ret){strm.msg='invalid literal/lengths set';state.mode=BAD;break;}
state.distbits=6;state.distcode=state.distdyn;opts={bits:state.distbits};ret=inflate_table(DISTS,state.lens,state.nlen,state.ndist,state.distcode,0,state.work,opts);state.distbits=opts.bits;if(ret){strm.msg='invalid distances set';state.mode=BAD;break;}
state.mode=LEN_;if(flush===Z_TREES){break inf_leave;}
case LEN_:state.mode=LEN;case LEN:if(have>=6&&left>=258){strm.next_out=put;strm.avail_out=left;strm.next_in=next;strm.avail_in=have;state.hold=hold;state.bits=bits;inflate_fast(strm,_out);put=strm.next_out;output=strm.output;left=strm.avail_out;next=strm.next_in;input=strm.input;have=strm.avail_in;hold=state.hold;bits=state.bits;if(state.mode===TYPE){state.back=-1;}
break;}
state.back=0;for(;;){here=state.lencode[hold&((1<<state.lenbits)-1)];here_bits=here>>>24;here_op=(here>>>16)&0xff;here_val=here&0xffff;if(here_bits<=bits){break;}
if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if(here_op&&(here_op&0xf0)===0){last_bits=here_bits;last_op=here_op;last_val=here_val;for(;;){here=state.lencode[last_val+
((hold&((1<<(last_bits+last_op))-1))>>last_bits)];here_bits=here>>>24;here_op=(here>>>16)&0xff;here_val=here&0xffff;if((last_bits+here_bits)<=bits){break;}
if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
hold>>>=last_bits;bits-=last_bits;state.back+=last_bits;}
hold>>>=here_bits;bits-=here_bits;state.back+=here_bits;state.length=here_val;if(here_op===0){state.mode=LIT;break;}
if(here_op&32){state.back=-1;state.mode=TYPE;break;}
if(here_op&64){strm.msg='invalid literal/length code';state.mode=BAD;break;}
state.extra=here_op&15;state.mode=LENEXT;case LENEXT:if(state.extra){n=state.extra;while(bits<n){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.length+=hold&((1<<state.extra)-1);hold>>>=state.extra;bits-=state.extra;state.back+=state.extra;}
state.was=state.length;state.mode=DIST;case DIST:for(;;){here=state.distcode[hold&((1<<state.distbits)-1)];here_bits=here>>>24;here_op=(here>>>16)&0xff;here_val=here&0xffff;if((here_bits)<=bits){break;}
if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if((here_op&0xf0)===0){last_bits=here_bits;last_op=here_op;last_val=here_val;for(;;){here=state.distcode[last_val+
((hold&((1<<(last_bits+last_op))-1))>>last_bits)];here_bits=here>>>24;here_op=(here>>>16)&0xff;here_val=here&0xffff;if((last_bits+here_bits)<=bits){break;}
if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
hold>>>=last_bits;bits-=last_bits;state.back+=last_bits;}
hold>>>=here_bits;bits-=here_bits;state.back+=here_bits;if(here_op&64){strm.msg='invalid distance code';state.mode=BAD;break;}
state.offset=here_val;state.extra=(here_op)&15;state.mode=DISTEXT;case DISTEXT:if(state.extra){n=state.extra;while(bits<n){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
state.offset+=hold&((1<<state.extra)-1);hold>>>=state.extra;bits-=state.extra;state.back+=state.extra;}
if(state.offset>state.dmax){strm.msg='invalid distance too far back';state.mode=BAD;break;}
state.mode=MATCH;case MATCH:if(left===0){break inf_leave;}
copy=_out-left;if(state.offset>copy){copy=state.offset-copy;if(copy>state.whave){if(state.sane){strm.msg='invalid distance too far back';state.mode=BAD;break;}}
if(copy>state.wnext){copy-=state.wnext;from=state.wsize-copy;}
else{from=state.wnext-copy;}
if(copy>state.length){copy=state.length;}
from_source=state.window;}
else{from_source=output;from=put-state.offset;copy=state.length;}
if(copy>left){copy=left;}
left-=copy;state.length-=copy;do{output[put++]=from_source[from++];}while(--copy);if(state.length===0){state.mode=LEN;}
break;case LIT:if(left===0){break inf_leave;}
output[put++]=state.length;left--;state.mode=LEN;break;case CHECK:if(state.wrap){while(bits<32){if(have===0){break inf_leave;}
have--;hold|=input[next++]<<bits;bits+=8;}
_out-=left;strm.total_out+=_out;state.total+=_out;if(_out){strm.adler=state.check=(state.flags?crc32(state.check,output,_out,put-_out):adler32(state.check,output,_out,put-_out));}
_out=left;if((state.flags?hold:zswap32(hold))!==state.check){strm.msg='incorrect data check';state.mode=BAD;break;}
hold=0;bits=0;}
state.mode=LENGTH;case LENGTH:if(state.wrap&&state.flags){while(bits<32){if(have===0){break inf_leave;}
have--;hold+=input[next++]<<bits;bits+=8;}
if(hold!==(state.total&0xffffffff)){strm.msg='incorrect length check';state.mode=BAD;break;}
hold=0;bits=0;}
state.mode=DONE;case DONE:ret=Z_STREAM_END;break inf_leave;case BAD:ret=Z_DATA_ERROR;break inf_leave;case MEM:return Z_MEM_ERROR;case SYNC:default:return Z_STREAM_ERROR;}}
strm.next_out=put;strm.avail_out=left;strm.next_in=next;strm.avail_in=have;state.hold=hold;state.bits=bits;if(state.wsize||(_out!==strm.avail_out&&state.mode<BAD&&(state.mode<CHECK||flush!==Z_FINISH))){if(updatewindow(strm,strm.output,strm.next_out,_out-strm.avail_out)){state.mode=MEM;return Z_MEM_ERROR;}}
_in-=strm.avail_in;_out-=strm.avail_out;strm.total_in+=_in;strm.total_out+=_out;state.total+=_out;if(state.wrap&&_out){strm.adler=state.check=(state.flags?crc32(state.check,output,_out,strm.next_out-_out):adler32(state.check,output,_out,strm.next_out-_out));}
strm.data_type=state.bits+(state.last?64:0)+
(state.mode===TYPE?128:0)+
(state.mode===LEN_||state.mode===COPY_?256:0);if(((_in===0&&_out===0)||flush===Z_FINISH)&&ret===Z_OK){ret=Z_BUF_ERROR;}
return ret;}
function inflateEnd(strm){if(!strm||!strm.state){return Z_STREAM_ERROR;}
var state=strm.state;if(state.window){state.window=null;}
strm.state=null;return Z_OK;}
function inflateGetHeader(strm,head){var state;if(!strm||!strm.state){return Z_STREAM_ERROR;}
state=strm.state;if((state.wrap&2)===0){return Z_STREAM_ERROR;}
state.head=head;head.done=false;return Z_OK;}
function inflateSetDictionary(strm,dictionary){var dictLength=dictionary.length;var state;var dictid;var ret;if(!strm||!strm.state){return Z_STREAM_ERROR;}
state=strm.state;if(state.wrap!==0&&state.mode!==DICT){return Z_STREAM_ERROR;}
if(state.mode===DICT){dictid=1;dictid=adler32(dictid,dictionary,dictLength,0);if(dictid!==state.check){return Z_DATA_ERROR;}}
ret=updatewindow(strm,dictionary,dictLength,dictLength);if(ret){state.mode=MEM;return Z_MEM_ERROR;}
state.havedict=1;return Z_OK;}
exports.inflateReset=inflateReset;exports.inflateReset2=inflateReset2;exports.inflateResetKeep=inflateResetKeep;exports.inflateInit=inflateInit;exports.inflateInit2=inflateInit2;exports.inflate=inflate;exports.inflateEnd=inflateEnd;exports.inflateGetHeader=inflateGetHeader;exports.inflateSetDictionary=inflateSetDictionary;exports.inflateInfo='pako inflate (from Nodeca project)';},{"../utils/common":123,"./adler32":125,"./crc32":127,"./inffast":130,"./inftrees":132}],132:[function(require,module,exports){'use strict';var utils=require('../utils/common');var MAXBITS=15;var ENOUGH_LENS=852;var ENOUGH_DISTS=592;var CODES=0;var LENS=1;var DISTS=2;var lbase=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0];var lext=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78];var dbase=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0];var dext=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];module.exports=function inflate_table(type,lens,lens_index,codes,table,table_index,work,opts)
{var bits=opts.bits;var len=0;var sym=0;var min=0,max=0;var root=0;var curr=0;var drop=0;var left=0;var used=0;var huff=0;var incr;var fill;var low;var mask;var next;var base=null;var base_index=0;var end;var count=new utils.Buf16(MAXBITS+1);var offs=new utils.Buf16(MAXBITS+1);var extra=null;var extra_index=0;var here_bits,here_op,here_val;for(len=0;len<=MAXBITS;len++){count[len]=0;}
for(sym=0;sym<codes;sym++){count[lens[lens_index+sym]]++;}
root=bits;for(max=MAXBITS;max>=1;max--){if(count[max]!==0){break;}}
if(root>max){root=max;}
if(max===0){table[table_index++]=(1<<24)|(64<<16)|0;table[table_index++]=(1<<24)|(64<<16)|0;opts.bits=1;return 0;}
for(min=1;min<max;min++){if(count[min]!==0){break;}}
if(root<min){root=min;}
left=1;for(len=1;len<=MAXBITS;len++){left<<=1;left-=count[len];if(left<0){return-1;}}
if(left>0&&(type===CODES||max!==1)){return-1;}
offs[1]=0;for(len=1;len<MAXBITS;len++){offs[len+1]=offs[len]+count[len];}
for(sym=0;sym<codes;sym++){if(lens[lens_index+sym]!==0){work[offs[lens[lens_index+sym]]++]=sym;}}
if(type===CODES){base=extra=work;end=19;}else if(type===LENS){base=lbase;base_index-=257;extra=lext;extra_index-=257;end=256;}else{base=dbase;extra=dext;end=-1;}
huff=0;sym=0;len=min;next=table_index;curr=root;drop=0;low=-1;used=1<<root;mask=used-1;if((type===LENS&&used>ENOUGH_LENS)||(type===DISTS&&used>ENOUGH_DISTS)){return 1;}
var i=0;for(;;){i++;here_bits=len-drop;if(work[sym]<end){here_op=0;here_val=work[sym];}
else if(work[sym]>end){here_op=extra[extra_index+work[sym]];here_val=base[base_index+work[sym]];}
else{here_op=32+64;here_val=0;}
incr=1<<(len-drop);fill=1<<curr;min=fill;do{fill-=incr;table[next+(huff>>drop)+fill]=(here_bits<<24)|(here_op<<16)|here_val|0;}while(fill!==0);incr=1<<(len-1);while(huff&incr){incr>>=1;}
if(incr!==0){huff&=incr-1;huff+=incr;}else{huff=0;}
sym++;if(--count[len]===0){if(len===max){break;}
len=lens[lens_index+work[sym]];}
if(len>root&&(huff&mask)!==low){if(drop===0){drop=root;}
next+=min;curr=len-drop;left=1<<curr;while(curr+drop<max){left-=count[curr+drop];if(left<=0){break;}
curr++;left<<=1;}
used+=1<<curr;if((type===LENS&&used>ENOUGH_LENS)||(type===DISTS&&used>ENOUGH_DISTS)){return 1;}
low=huff&mask;table[low]=(root<<24)|(curr<<16)|(next-table_index)|0;}}
if(huff!==0){table[next+huff]=((len-drop)<<24)|(64<<16)|0;}
opts.bits=root;return 0;};},{"../utils/common":123}],133:[function(require,module,exports){'use strict';module.exports={2:'need dictionary',1:'stream end',0:'','-1':'file error','-2':'stream error','-3':'data error','-4':'insufficient memory','-5':'buffer error','-6':'incompatible version'};},{}],134:[function(require,module,exports){'use strict';var utils=require('../utils/common');var Z_FIXED=4;var Z_BINARY=0;var Z_TEXT=1;var Z_UNKNOWN=2;function zero(buf){var len=buf.length;while(--len>=0){buf[len]=0;}}
var STORED_BLOCK=0;var STATIC_TREES=1;var DYN_TREES=2;var MIN_MATCH=3;var MAX_MATCH=258;var LENGTH_CODES=29;var LITERALS=256;var L_CODES=LITERALS+1+LENGTH_CODES;var D_CODES=30;var BL_CODES=19;var HEAP_SIZE=2*L_CODES+1;var MAX_BITS=15;var Buf_size=16;var MAX_BL_BITS=7;var END_BLOCK=256;var REP_3_6=16;var REPZ_3_10=17;var REPZ_11_138=18;var extra_lbits=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];var extra_dbits=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];var extra_blbits=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];var bl_order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];var DIST_CODE_LEN=512;var static_ltree=new Array((L_CODES+2)*2);zero(static_ltree);var static_dtree=new Array(D_CODES*2);zero(static_dtree);var _dist_code=new Array(DIST_CODE_LEN);zero(_dist_code);var _length_code=new Array(MAX_MATCH-MIN_MATCH+1);zero(_length_code);var base_length=new Array(LENGTH_CODES);zero(base_length);var base_dist=new Array(D_CODES);zero(base_dist);function StaticTreeDesc(static_tree,extra_bits,extra_base,elems,max_length){this.static_tree=static_tree;this.extra_bits=extra_bits;this.extra_base=extra_base;this.elems=elems;this.max_length=max_length;this.has_stree=static_tree&&static_tree.length;}
var static_l_desc;var static_d_desc;var static_bl_desc;function TreeDesc(dyn_tree,stat_desc){this.dyn_tree=dyn_tree;this.max_code=0;this.stat_desc=stat_desc;}
function d_code(dist){return dist<256?_dist_code[dist]:_dist_code[256+(dist>>>7)];}
function put_short(s,w){s.pending_buf[s.pending++]=(w)&0xff;s.pending_buf[s.pending++]=(w>>>8)&0xff;}
function send_bits(s,value,length){if(s.bi_valid>(Buf_size-length)){s.bi_buf|=(value<<s.bi_valid)&0xffff;put_short(s,s.bi_buf);s.bi_buf=value>>(Buf_size-s.bi_valid);s.bi_valid+=length-Buf_size;}else{s.bi_buf|=(value<<s.bi_valid)&0xffff;s.bi_valid+=length;}}
function send_code(s,c,tree){send_bits(s,tree[c*2],tree[c*2+1]);}
function bi_reverse(code,len){var res=0;do{res|=code&1;code>>>=1;res<<=1;}while(--len>0);return res>>>1;}
function bi_flush(s){if(s.bi_valid===16){put_short(s,s.bi_buf);s.bi_buf=0;s.bi_valid=0;}else if(s.bi_valid>=8){s.pending_buf[s.pending++]=s.bi_buf&0xff;s.bi_buf>>=8;s.bi_valid-=8;}}
function gen_bitlen(s,desc)
{var tree=desc.dyn_tree;var max_code=desc.max_code;var stree=desc.stat_desc.static_tree;var has_stree=desc.stat_desc.has_stree;var extra=desc.stat_desc.extra_bits;var base=desc.stat_desc.extra_base;var max_length=desc.stat_desc.max_length;var h;var n,m;var bits;var xbits;var f;var overflow=0;for(bits=0;bits<=MAX_BITS;bits++){s.bl_count[bits]=0;}
tree[s.heap[s.heap_max]*2+1]=0;for(h=s.heap_max+1;h<HEAP_SIZE;h++){n=s.heap[h];bits=tree[tree[n*2+1]*2+1]+1;if(bits>max_length){bits=max_length;overflow++;}
tree[n*2+1]=bits;if(n>max_code){continue;}
s.bl_count[bits]++;xbits=0;if(n>=base){xbits=extra[n-base];}
f=tree[n*2];s.opt_len+=f*(bits+xbits);if(has_stree){s.static_len+=f*(stree[n*2+1]+xbits);}}
if(overflow===0){return;}
do{bits=max_length-1;while(s.bl_count[bits]===0){bits--;}
s.bl_count[bits]--;s.bl_count[bits+1]+=2;s.bl_count[max_length]--;overflow-=2;}while(overflow>0);for(bits=max_length;bits!==0;bits--){n=s.bl_count[bits];while(n!==0){m=s.heap[--h];if(m>max_code){continue;}
if(tree[m*2+1]!==bits){s.opt_len+=(bits-tree[m*2+1])*tree[m*2];tree[m*2+1]=bits;}
n--;}}}
function gen_codes(tree,max_code,bl_count)
{var next_code=new Array(MAX_BITS+1);var code=0;var bits;var n;for(bits=1;bits<=MAX_BITS;bits++){next_code[bits]=code=(code+bl_count[bits-1])<<1;}
for(n=0;n<=max_code;n++){var len=tree[n*2+1];if(len===0){continue;}
tree[n*2]=bi_reverse(next_code[len]++,len);}}
function tr_static_init(){var n;var bits;var length;var code;var dist;var bl_count=new Array(MAX_BITS+1);length=0;for(code=0;code<LENGTH_CODES-1;code++){base_length[code]=length;for(n=0;n<(1<<extra_lbits[code]);n++){_length_code[length++]=code;}}
_length_code[length-1]=code;dist=0;for(code=0;code<16;code++){base_dist[code]=dist;for(n=0;n<(1<<extra_dbits[code]);n++){_dist_code[dist++]=code;}}
dist>>=7;for(;code<D_CODES;code++){base_dist[code]=dist<<7;for(n=0;n<(1<<(extra_dbits[code]-7));n++){_dist_code[256+dist++]=code;}}
for(bits=0;bits<=MAX_BITS;bits++){bl_count[bits]=0;}
n=0;while(n<=143){static_ltree[n*2+1]=8;n++;bl_count[8]++;}
while(n<=255){static_ltree[n*2+1]=9;n++;bl_count[9]++;}
while(n<=279){static_ltree[n*2+1]=7;n++;bl_count[7]++;}
while(n<=287){static_ltree[n*2+1]=8;n++;bl_count[8]++;}
gen_codes(static_ltree,L_CODES+1,bl_count);for(n=0;n<D_CODES;n++){static_dtree[n*2+1]=5;static_dtree[n*2]=bi_reverse(n,5);}
static_l_desc=new StaticTreeDesc(static_ltree,extra_lbits,LITERALS+1,L_CODES,MAX_BITS);static_d_desc=new StaticTreeDesc(static_dtree,extra_dbits,0,D_CODES,MAX_BITS);static_bl_desc=new StaticTreeDesc(new Array(0),extra_blbits,0,BL_CODES,MAX_BL_BITS);}
function init_block(s){var n;for(n=0;n<L_CODES;n++){s.dyn_ltree[n*2]=0;}
for(n=0;n<D_CODES;n++){s.dyn_dtree[n*2]=0;}
for(n=0;n<BL_CODES;n++){s.bl_tree[n*2]=0;}
s.dyn_ltree[END_BLOCK*2]=1;s.opt_len=s.static_len=0;s.last_lit=s.matches=0;}
function bi_windup(s)
{if(s.bi_valid>8){put_short(s,s.bi_buf);}else if(s.bi_valid>0){s.pending_buf[s.pending++]=s.bi_buf;}
s.bi_buf=0;s.bi_valid=0;}
function copy_block(s,buf,len,header)
{bi_windup(s);if(header){put_short(s,len);put_short(s,~len);}
utils.arraySet(s.pending_buf,s.window,buf,len,s.pending);s.pending+=len;}
function smaller(tree,n,m,depth){var _n2=n*2;var _m2=m*2;return(tree[_n2]<tree[_m2]||(tree[_n2]===tree[_m2]&&depth[n]<=depth[m]));}
function pqdownheap(s,tree,k)
{var v=s.heap[k];var j=k<<1;while(j<=s.heap_len){if(j<s.heap_len&&smaller(tree,s.heap[j+1],s.heap[j],s.depth)){j++;}
if(smaller(tree,v,s.heap[j],s.depth)){break;}
s.heap[k]=s.heap[j];k=j;j<<=1;}
s.heap[k]=v;}
function compress_block(s,ltree,dtree)
{var dist;var lc;var lx=0;var code;var extra;if(s.last_lit!==0){do{dist=(s.pending_buf[s.d_buf+lx*2]<<8)|(s.pending_buf[s.d_buf+lx*2+1]);lc=s.pending_buf[s.l_buf+lx];lx++;if(dist===0){send_code(s,lc,ltree);}else{code=_length_code[lc];send_code(s,code+LITERALS+1,ltree);extra=extra_lbits[code];if(extra!==0){lc-=base_length[code];send_bits(s,lc,extra);}
dist--;code=d_code(dist);send_code(s,code,dtree);extra=extra_dbits[code];if(extra!==0){dist-=base_dist[code];send_bits(s,dist,extra);}}}while(lx<s.last_lit);}
send_code(s,END_BLOCK,ltree);}
function build_tree(s,desc)
{var tree=desc.dyn_tree;var stree=desc.stat_desc.static_tree;var has_stree=desc.stat_desc.has_stree;var elems=desc.stat_desc.elems;var n,m;var max_code=-1;var node;s.heap_len=0;s.heap_max=HEAP_SIZE;for(n=0;n<elems;n++){if(tree[n*2]!==0){s.heap[++s.heap_len]=max_code=n;s.depth[n]=0;}else{tree[n*2+1]=0;}}
while(s.heap_len<2){node=s.heap[++s.heap_len]=(max_code<2?++max_code:0);tree[node*2]=1;s.depth[node]=0;s.opt_len--;if(has_stree){s.static_len-=stree[node*2+1];}}
desc.max_code=max_code;for(n=(s.heap_len>>1);n>=1;n--){pqdownheap(s,tree,n);}
node=elems;do{n=s.heap[1];s.heap[1]=s.heap[s.heap_len--];pqdownheap(s,tree,1);m=s.heap[1];s.heap[--s.heap_max]=n;s.heap[--s.heap_max]=m;tree[node*2]=tree[n*2]+tree[m*2];s.depth[node]=(s.depth[n]>=s.depth[m]?s.depth[n]:s.depth[m])+1;tree[n*2+1]=tree[m*2+1]=node;s.heap[1]=node++;pqdownheap(s,tree,1);}while(s.heap_len>=2);s.heap[--s.heap_max]=s.heap[1];gen_bitlen(s,desc);gen_codes(tree,max_code,s.bl_count);}
function scan_tree(s,tree,max_code)
{var n;var prevlen=-1;var curlen;var nextlen=tree[0*2+1];var count=0;var max_count=7;var min_count=4;if(nextlen===0){max_count=138;min_count=3;}
tree[(max_code+1)*2+1]=0xffff;for(n=0;n<=max_code;n++){curlen=nextlen;nextlen=tree[(n+1)*2+1];if(++count<max_count&&curlen===nextlen){continue;}else if(count<min_count){s.bl_tree[curlen*2]+=count;}else if(curlen!==0){if(curlen!==prevlen){s.bl_tree[curlen*2]++;}
s.bl_tree[REP_3_6*2]++;}else if(count<=10){s.bl_tree[REPZ_3_10*2]++;}else{s.bl_tree[REPZ_11_138*2]++;}
count=0;prevlen=curlen;if(nextlen===0){max_count=138;min_count=3;}else if(curlen===nextlen){max_count=6;min_count=3;}else{max_count=7;min_count=4;}}}
function send_tree(s,tree,max_code)
{var n;var prevlen=-1;var curlen;var nextlen=tree[0*2+1];var count=0;var max_count=7;var min_count=4;if(nextlen===0){max_count=138;min_count=3;}
for(n=0;n<=max_code;n++){curlen=nextlen;nextlen=tree[(n+1)*2+1];if(++count<max_count&&curlen===nextlen){continue;}else if(count<min_count){do{send_code(s,curlen,s.bl_tree);}while(--count!==0);}else if(curlen!==0){if(curlen!==prevlen){send_code(s,curlen,s.bl_tree);count--;}
send_code(s,REP_3_6,s.bl_tree);send_bits(s,count-3,2);}else if(count<=10){send_code(s,REPZ_3_10,s.bl_tree);send_bits(s,count-3,3);}else{send_code(s,REPZ_11_138,s.bl_tree);send_bits(s,count-11,7);}
count=0;prevlen=curlen;if(nextlen===0){max_count=138;min_count=3;}else if(curlen===nextlen){max_count=6;min_count=3;}else{max_count=7;min_count=4;}}}
function build_bl_tree(s){var max_blindex;scan_tree(s,s.dyn_ltree,s.l_desc.max_code);scan_tree(s,s.dyn_dtree,s.d_desc.max_code);build_tree(s,s.bl_desc);for(max_blindex=BL_CODES-1;max_blindex>=3;max_blindex--){if(s.bl_tree[bl_order[max_blindex]*2+1]!==0){break;}}
s.opt_len+=3*(max_blindex+1)+5+5+4;return max_blindex;}
function send_all_trees(s,lcodes,dcodes,blcodes)
{var rank;send_bits(s,lcodes-257,5);send_bits(s,dcodes-1,5);send_bits(s,blcodes-4,4);for(rank=0;rank<blcodes;rank++){send_bits(s,s.bl_tree[bl_order[rank]*2+1],3);}
send_tree(s,s.dyn_ltree,lcodes-1);send_tree(s,s.dyn_dtree,dcodes-1);}
function detect_data_type(s){var black_mask=0xf3ffc07f;var n;for(n=0;n<=31;n++,black_mask>>>=1){if((black_mask&1)&&(s.dyn_ltree[n*2]!==0)){return Z_BINARY;}}
if(s.dyn_ltree[9*2]!==0||s.dyn_ltree[10*2]!==0||s.dyn_ltree[13*2]!==0){return Z_TEXT;}
for(n=32;n<LITERALS;n++){if(s.dyn_ltree[n*2]!==0){return Z_TEXT;}}
return Z_BINARY;}
var static_init_done=false;function _tr_init(s)
{if(!static_init_done){tr_static_init();static_init_done=true;}
s.l_desc=new TreeDesc(s.dyn_ltree,static_l_desc);s.d_desc=new TreeDesc(s.dyn_dtree,static_d_desc);s.bl_desc=new TreeDesc(s.bl_tree,static_bl_desc);s.bi_buf=0;s.bi_valid=0;init_block(s);}
function _tr_stored_block(s,buf,stored_len,last)
{send_bits(s,(STORED_BLOCK<<1)+(last?1:0),3);copy_block(s,buf,stored_len,true);}
function _tr_align(s){send_bits(s,STATIC_TREES<<1,3);send_code(s,END_BLOCK,static_ltree);bi_flush(s);}
function _tr_flush_block(s,buf,stored_len,last)
{var opt_lenb,static_lenb;var max_blindex=0;if(s.level>0){if(s.strm.data_type===Z_UNKNOWN){s.strm.data_type=detect_data_type(s);}
build_tree(s,s.l_desc);build_tree(s,s.d_desc);max_blindex=build_bl_tree(s);opt_lenb=(s.opt_len+3+7)>>>3;static_lenb=(s.static_len+3+7)>>>3;if(static_lenb<=opt_lenb){opt_lenb=static_lenb;}}else{opt_lenb=static_lenb=stored_len+5;}
if((stored_len+4<=opt_lenb)&&(buf!==-1)){_tr_stored_block(s,buf,stored_len,last);}else if(s.strategy===Z_FIXED||static_lenb===opt_lenb){send_bits(s,(STATIC_TREES<<1)+(last?1:0),3);compress_block(s,static_ltree,static_dtree);}else{send_bits(s,(DYN_TREES<<1)+(last?1:0),3);send_all_trees(s,s.l_desc.max_code+1,s.d_desc.max_code+1,max_blindex+1);compress_block(s,s.dyn_ltree,s.dyn_dtree);}
init_block(s);if(last){bi_windup(s);}}
function _tr_tally(s,dist,lc)
{s.pending_buf[s.d_buf+s.last_lit*2]=(dist>>>8)&0xff;s.pending_buf[s.d_buf+s.last_lit*2+1]=dist&0xff;s.pending_buf[s.l_buf+s.last_lit]=lc&0xff;s.last_lit++;if(dist===0){s.dyn_ltree[lc*2]++;}else{s.matches++;dist--;s.dyn_ltree[(_length_code[lc]+LITERALS+1)*2]++;s.dyn_dtree[d_code(dist)*2]++;}
return(s.last_lit===s.lit_bufsize-1);}
exports._tr_init=_tr_init;exports._tr_stored_block=_tr_stored_block;exports._tr_flush_block=_tr_flush_block;exports._tr_tally=_tr_tally;exports._tr_align=_tr_align;},{"../utils/common":123}],135:[function(require,module,exports){'use strict';function ZStream(){this.input=null;this.next_in=0;this.avail_in=0;this.total_in=0;this.output=null;this.next_out=0;this.avail_out=0;this.total_out=0;this.msg='';this.state=null;this.data_type=2;this.adler=0;}
module.exports=ZStream;},{}],136:[function(require,module,exports){(function(process){function normalizeArray(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==='.'){parts.splice(i,1);}else if(last==='..'){parts.splice(i,1);up++;}else if(up){parts.splice(i,1);up--;}}
if(allowAboveRoot){for(;up--;up){parts.unshift('..');}}
return parts;}
var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;var splitPath=function(filename){return splitPathRe.exec(filename).slice(1);};exports.resolve=function(){var resolvedPath='',resolvedAbsolute=false;for(var i=arguments.length-1;i>=-1&&!resolvedAbsolute;i--){var path=(i>=0)?arguments[i]:process.cwd();if(typeof path!=='string'){throw new TypeError('Arguments to path.resolve must be strings');}else if(!path){continue;}
resolvedPath=path+'/'+resolvedPath;resolvedAbsolute=path.charAt(0)==='/';}
resolvedPath=normalizeArray(filter(resolvedPath.split('/'),function(p){return!!p;}),!resolvedAbsolute).join('/');return((resolvedAbsolute?'/':'')+resolvedPath)||'.';};exports.normalize=function(path){var isAbsolute=exports.isAbsolute(path),trailingSlash=substr(path,-1)==='/';path=normalizeArray(filter(path.split('/'),function(p){return!!p;}),!isAbsolute).join('/');if(!path&&!isAbsolute){path='.';}
if(path&&trailingSlash){path+='/';}
return(isAbsolute?'/':'')+path;};exports.isAbsolute=function(path){return path.charAt(0)==='/';};exports.join=function(){var paths=Array.prototype.slice.call(arguments,0);return exports.normalize(filter(paths,function(p,index){if(typeof p!=='string'){throw new TypeError('Arguments to path.join must be strings');}
return p;}).join('/'));};exports.relative=function(from,to){from=exports.resolve(from).substr(1);to=exports.resolve(to).substr(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=='')break;}
var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=='')break;}
if(start>end)return[];return arr.slice(start,end-start+1);}
var fromParts=trim(from.split('/'));var toParts=trim(to.split('/'));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break;}}
var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push('..');}
outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join('/');};exports.sep='/';exports.delimiter=':';exports.dirname=function(path){var result=splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return '.';}
if(dir){dir=dir.substr(0,dir.length-1);}
return root+dir;};exports.basename=function(path,ext){var f=splitPath(path)[2];if(ext&&f.substr(-1*ext.length)===ext){f=f.substr(0,f.length-ext.length);}
return f;};exports.extname=function(path){return splitPath(path)[3];};function filter(xs,f){if(xs.filter)return xs.filter(f);var res=[];for(var i=0;i<xs.length;i++){if(f(xs[i],i,xs))res.push(xs[i]);}
return res;}
var substr='ab'.substr(-1)==='b'?function(str,start,len){return str.substr(start,len)}:function(str,start,len){if(start<0)start=str.length+start;return str.substr(start,len);};}).call(this,require('_process'))},{"_process":138}],137:[function(require,module,exports){(function(process){'use strict';if(!process.version||process.version.indexOf('v0.')===0||process.version.indexOf('v1.')===0&&process.version.indexOf('v1.8.')!==0){module.exports=nextTick;}else{module.exports=process.nextTick;}
function nextTick(fn,arg1,arg2,arg3){if(typeof fn!=='function'){throw new TypeError('"callback" argument must be a function');}
var len=arguments.length;var args,i;switch(len){case 0:case 1:return process.nextTick(fn);case 2:return process.nextTick(function afterTickOne(){fn.call(null,arg1);});case 3:return process.nextTick(function afterTickTwo(){fn.call(null,arg1,arg2);});case 4:return process.nextTick(function afterTickThree(){fn.call(null,arg1,arg2,arg3);});default:args=new Array(len-1);i=0;while(i<args.length){args[i++]=arguments[i];}
return process.nextTick(function afterTick(){fn.apply(null,args);});}}}).call(this,require('_process'))},{"_process":138}],138:[function(require,module,exports){var process=module.exports={};var cachedSetTimeout;var cachedClearTimeout;function defaultSetTimout(){throw new Error('setTimeout has not been defined');}
function defaultClearTimeout(){throw new Error('clearTimeout has not been defined');}
(function(){try{if(typeof setTimeout==='function'){cachedSetTimeout=setTimeout;}else{cachedSetTimeout=defaultSetTimout;}}catch(e){cachedSetTimeout=defaultSetTimout;}
try{if(typeof clearTimeout==='function'){cachedClearTimeout=clearTimeout;}else{cachedClearTimeout=defaultClearTimeout;}}catch(e){cachedClearTimeout=defaultClearTimeout;}}())
function runTimeout(fun){if(cachedSetTimeout===setTimeout){return setTimeout(fun,0);}
if((cachedSetTimeout===defaultSetTimout||!cachedSetTimeout)&&setTimeout){cachedSetTimeout=setTimeout;return setTimeout(fun,0);}
try{return cachedSetTimeout(fun,0);}catch(e){try{return cachedSetTimeout.call(null,fun,0);}catch(e){return cachedSetTimeout.call(this,fun,0);}}}
function runClearTimeout(marker){if(cachedClearTimeout===clearTimeout){return clearTimeout(marker);}
if((cachedClearTimeout===defaultClearTimeout||!cachedClearTimeout)&&clearTimeout){cachedClearTimeout=clearTimeout;return clearTimeout(marker);}
try{return cachedClearTimeout(marker);}catch(e){try{return cachedClearTimeout.call(null,marker);}catch(e){return cachedClearTimeout.call(this,marker);}}}
var queue=[];var draining=false;var currentQueue;var queueIndex=-1;function cleanUpNextTick(){if(!draining||!currentQueue){return;}
draining=false;if(currentQueue.length){queue=currentQueue.concat(queue);}else{queueIndex=-1;}
if(queue.length){drainQueue();}}
function drainQueue(){if(draining){return;}
var timeout=runTimeout(cleanUpNextTick);draining=true;var len=queue.length;while(len){currentQueue=queue;queue=[];while(++queueIndex<len){if(currentQueue){currentQueue[queueIndex].run();}}
queueIndex=-1;len=queue.length;}
currentQueue=null;draining=false;runClearTimeout(timeout);}
process.nextTick=function(fun){var args=new Array(arguments.length-1);if(arguments.length>1){for(var i=1;i<arguments.length;i++){args[i-1]=arguments[i];}}
queue.push(new Item(fun,args));if(queue.length===1&&!draining){runTimeout(drainQueue);}};function Item(fun,array){this.fun=fun;this.array=array;}
Item.prototype.run=function(){this.fun.apply(null,this.array);};process.title='browser';process.browser=true;process.env={};process.argv=[];process.version='';process.versions={};function noop(){}
process.on=noop;process.addListener=noop;process.once=noop;process.off=noop;process.removeListener=noop;process.removeAllListeners=noop;process.emit=noop;process.binding=function(name){throw new Error('process.binding is not supported');};process.cwd=function(){return '/'};process.chdir=function(dir){throw new Error('process.chdir is not supported');};process.umask=function(){return 0;};},{}],139:[function(require,module,exports){module.exports=require("./lib/_stream_duplex.js")},{"./lib/_stream_duplex.js":140}],140:[function(require,module,exports){'use strict';var objectKeys=Object.keys||function(obj){var keys=[];for(var key in obj){keys.push(key);}return keys;};module.exports=Duplex;var processNextTick=require('process-nextick-args');var util=require('core-util-is');util.inherits=require('inherits');var Readable=require('./_stream_readable');var Writable=require('./_stream_writable');util.inherits(Duplex,Readable);var keys=objectKeys(Writable.prototype);for(var v=0;v<keys.length;v++){var method=keys[v];if(!Duplex.prototype[method])Duplex.prototype[method]=Writable.prototype[method];}
function Duplex(options){if(!(this instanceof Duplex))return new Duplex(options);Readable.call(this,options);Writable.call(this,options);if(options&&options.readable===false)this.readable=false;if(options&&options.writable===false)this.writable=false;this.allowHalfOpen=true;if(options&&options.allowHalfOpen===false)this.allowHalfOpen=false;this.once('end',onend);}
function onend(){if(this.allowHalfOpen||this._writableState.ended)return;processNextTick(onEndNT,this);}
function onEndNT(self){self.end();}
function forEach(xs,f){for(var i=0,l=xs.length;i<l;i++){f(xs[i],i);}}},{"./_stream_readable":142,"./_stream_writable":144,"core-util-is":78,"inherits":81,"process-nextick-args":137}],141:[function(require,module,exports){'use strict';module.exports=PassThrough;var Transform=require('./_stream_transform');var util=require('core-util-is');util.inherits=require('inherits');util.inherits(PassThrough,Transform);function PassThrough(options){if(!(this instanceof PassThrough))return new PassThrough(options);Transform.call(this,options);}
PassThrough.prototype._transform=function(chunk,encoding,cb){cb(null,chunk);};},{"./_stream_transform":143,"core-util-is":78,"inherits":81}],142:[function(require,module,exports){(function(process){'use strict';module.exports=Readable;var processNextTick=require('process-nextick-args');var isArray=require('isarray');var Duplex;Readable.ReadableState=ReadableState;var EE=require('events').EventEmitter;var EElistenerCount=function(emitter,type){return emitter.listeners(type).length;};var Stream;(function(){try{Stream=require('st'+'ream');}catch(_){}finally{if(!Stream)Stream=require('events').EventEmitter;}})();var Buffer=require('buffer').Buffer;var bufferShim=require('buffer-shims');var util=require('core-util-is');util.inherits=require('inherits');var debugUtil=require('util');var debug=void 0;if(debugUtil&&debugUtil.debuglog){debug=debugUtil.debuglog('stream');}else{debug=function(){};}
var BufferList=require('./internal/streams/BufferList');var StringDecoder;util.inherits(Readable,Stream);function prependListener(emitter,event,fn){if(typeof emitter.prependListener==='function'){return emitter.prependListener(event,fn);}else{if(!emitter._events||!emitter._events[event])emitter.on(event,fn);else if(isArray(emitter._events[event]))emitter._events[event].unshift(fn);else emitter._events[event]=[fn,emitter._events[event]];}}
function ReadableState(options,stream){Duplex=Duplex||require('./_stream_duplex');options=options||{};this.objectMode=!!options.objectMode;if(stream instanceof Duplex)this.objectMode=this.objectMode||!!options.readableObjectMode;var hwm=options.highWaterMark;var defaultHwm=this.objectMode?16:16*1024;this.highWaterMark=hwm||hwm===0?hwm:defaultHwm;this.highWaterMark=~~this.highWaterMark;this.buffer=new BufferList();this.length=0;this.pipes=null;this.pipesCount=0;this.flowing=null;this.ended=false;this.endEmitted=false;this.reading=false;this.sync=true;this.needReadable=false;this.emittedReadable=false;this.readableListening=false;this.resumeScheduled=false;this.defaultEncoding=options.defaultEncoding||'utf8';this.ranOut=false;this.awaitDrain=0;this.readingMore=false;this.decoder=null;this.encoding=null;if(options.encoding){if(!StringDecoder)StringDecoder=require('string_decoder/').StringDecoder;this.decoder=new StringDecoder(options.encoding);this.encoding=options.encoding;}}
function Readable(options){Duplex=Duplex||require('./_stream_duplex');if(!(this instanceof Readable))return new Readable(options);this._readableState=new ReadableState(options,this);this.readable=true;if(options&&typeof options.read==='function')this._read=options.read;Stream.call(this);}
Readable.prototype.push=function(chunk,encoding){var state=this._readableState;if(!state.objectMode&&typeof chunk==='string'){encoding=encoding||state.defaultEncoding;if(encoding!==state.encoding){chunk=bufferShim.from(chunk,encoding);encoding='';}}
return readableAddChunk(this,state,chunk,encoding,false);};Readable.prototype.unshift=function(chunk){var state=this._readableState;return readableAddChunk(this,state,chunk,'',true);};Readable.prototype.isPaused=function(){return this._readableState.flowing===false;};function readableAddChunk(stream,state,chunk,encoding,addToFront){var er=chunkInvalid(state,chunk);if(er){stream.emit('error',er);}else if(chunk===null){state.reading=false;onEofChunk(stream,state);}else if(state.objectMode||chunk&&chunk.length>0){if(state.ended&&!addToFront){var e=new Error('stream.push() after EOF');stream.emit('error',e);}else if(state.endEmitted&&addToFront){var _e=new Error('stream.unshift() after end event');stream.emit('error',_e);}else{var skipAdd;if(state.decoder&&!addToFront&&!encoding){chunk=state.decoder.write(chunk);skipAdd=!state.objectMode&&chunk.length===0;}
if(!addToFront)state.reading=false;if(!skipAdd){if(state.flowing&&state.length===0&&!state.sync){stream.emit('data',chunk);stream.read(0);}else{state.length+=state.objectMode?1:chunk.length;if(addToFront)state.buffer.unshift(chunk);else state.buffer.push(chunk);if(state.needReadable)emitReadable(stream);}}
maybeReadMore(stream,state);}}else if(!addToFront){state.reading=false;}
return needMoreData(state);}
function needMoreData(state){return!state.ended&&(state.needReadable||state.length<state.highWaterMark||state.length===0);}
Readable.prototype.setEncoding=function(enc){if(!StringDecoder)StringDecoder=require('string_decoder/').StringDecoder;this._readableState.decoder=new StringDecoder(enc);this._readableState.encoding=enc;return this;};var MAX_HWM=0x800000;function computeNewHighWaterMark(n){if(n>=MAX_HWM){n=MAX_HWM;}else{n--;n|=n>>>1;n|=n>>>2;n|=n>>>4;n|=n>>>8;n|=n>>>16;n++;}
return n;}
function howMuchToRead(n,state){if(n<=0||state.length===0&&state.ended)return 0;if(state.objectMode)return 1;if(n!==n){if(state.flowing&&state.length)return state.buffer.head.data.length;else return state.length;}
if(n>state.highWaterMark)state.highWaterMark=computeNewHighWaterMark(n);if(n<=state.length)return n;if(!state.ended){state.needReadable=true;return 0;}
return state.length;}
Readable.prototype.read=function(n){debug('read',n);n=parseInt(n,10);var state=this._readableState;var nOrig=n;if(n!==0)state.emittedReadable=false;if(n===0&&state.needReadable&&(state.length>=state.highWaterMark||state.ended)){debug('read: emitReadable',state.length,state.ended);if(state.length===0&&state.ended)endReadable(this);else emitReadable(this);return null;}
n=howMuchToRead(n,state);if(n===0&&state.ended){if(state.length===0)endReadable(this);return null;}
var doRead=state.needReadable;debug('need readable',doRead);if(state.length===0||state.length-n<state.highWaterMark){doRead=true;debug('length less than watermark',doRead);}
if(state.ended||state.reading){doRead=false;debug('reading or ended',doRead);}else if(doRead){debug('do read');state.reading=true;state.sync=true;if(state.length===0)state.needReadable=true;this._read(state.highWaterMark);state.sync=false;if(!state.reading)n=howMuchToRead(nOrig,state);}
var ret;if(n>0)ret=fromList(n,state);else ret=null;if(ret===null){state.needReadable=true;n=0;}else{state.length-=n;}
if(state.length===0){if(!state.ended)state.needReadable=true;if(nOrig!==n&&state.ended)endReadable(this);}
if(ret!==null)this.emit('data',ret);return ret;};function chunkInvalid(state,chunk){var er=null;if(!Buffer.isBuffer(chunk)&&typeof chunk!=='string'&&chunk!==null&&chunk!==undefined&&!state.objectMode){er=new TypeError('Invalid non-string/buffer chunk');}
return er;}
function onEofChunk(stream,state){if(state.ended)return;if(state.decoder){var chunk=state.decoder.end();if(chunk&&chunk.length){state.buffer.push(chunk);state.length+=state.objectMode?1:chunk.length;}}
state.ended=true;emitReadable(stream);}
function emitReadable(stream){var state=stream._readableState;state.needReadable=false;if(!state.emittedReadable){debug('emitReadable',state.flowing);state.emittedReadable=true;if(state.sync)processNextTick(emitReadable_,stream);else emitReadable_(stream);}}
function emitReadable_(stream){debug('emit readable');stream.emit('readable');flow(stream);}
function maybeReadMore(stream,state){if(!state.readingMore){state.readingMore=true;processNextTick(maybeReadMore_,stream,state);}}
function maybeReadMore_(stream,state){var len=state.length;while(!state.reading&&!state.flowing&&!state.ended&&state.length<state.highWaterMark){debug('maybeReadMore read 0');stream.read(0);if(len===state.length)
break;else len=state.length;}
state.readingMore=false;}
Readable.prototype._read=function(n){this.emit('error',new Error('_read() is not implemented'));};Readable.prototype.pipe=function(dest,pipeOpts){var src=this;var state=this._readableState;switch(state.pipesCount){case 0:state.pipes=dest;break;case 1:state.pipes=[state.pipes,dest];break;default:state.pipes.push(dest);break;}
state.pipesCount+=1;debug('pipe count=%d opts=%j',state.pipesCount,pipeOpts);var doEnd=(!pipeOpts||pipeOpts.end!==false)&&dest!==process.stdout&&dest!==process.stderr;var endFn=doEnd?onend:cleanup;if(state.endEmitted)processNextTick(endFn);else src.once('end',endFn);dest.on('unpipe',onunpipe);function onunpipe(readable){debug('onunpipe');if(readable===src){cleanup();}}
function onend(){debug('onend');dest.end();}
var ondrain=pipeOnDrain(src);dest.on('drain',ondrain);var cleanedUp=false;function cleanup(){debug('cleanup');dest.removeListener('close',onclose);dest.removeListener('finish',onfinish);dest.removeListener('drain',ondrain);dest.removeListener('error',onerror);dest.removeListener('unpipe',onunpipe);src.removeListener('end',onend);src.removeListener('end',cleanup);src.removeListener('data',ondata);cleanedUp=true;if(state.awaitDrain&&(!dest._writableState||dest._writableState.needDrain))ondrain();}
var increasedAwaitDrain=false;src.on('data',ondata);function ondata(chunk){debug('ondata');increasedAwaitDrain=false;var ret=dest.write(chunk);if(false===ret&&!increasedAwaitDrain){if((state.pipesCount===1&&state.pipes===dest||state.pipesCount>1&&indexOf(state.pipes,dest)!==-1)&&!cleanedUp){debug('false write response, pause',src._readableState.awaitDrain);src._readableState.awaitDrain++;increasedAwaitDrain=true;}
src.pause();}}
function onerror(er){debug('onerror',er);unpipe();dest.removeListener('error',onerror);if(EElistenerCount(dest,'error')===0)dest.emit('error',er);}
prependListener(dest,'error',onerror);function onclose(){dest.removeListener('finish',onfinish);unpipe();}
dest.once('close',onclose);function onfinish(){debug('onfinish');dest.removeListener('close',onclose);unpipe();}
dest.once('finish',onfinish);function unpipe(){debug('unpipe');src.unpipe(dest);}
dest.emit('pipe',src);if(!state.flowing){debug('pipe resume');src.resume();}
return dest;};function pipeOnDrain(src){return function(){var state=src._readableState;debug('pipeOnDrain',state.awaitDrain);if(state.awaitDrain)state.awaitDrain--;if(state.awaitDrain===0&&EElistenerCount(src,'data')){state.flowing=true;flow(src);}};}
Readable.prototype.unpipe=function(dest){var state=this._readableState;if(state.pipesCount===0)return this;if(state.pipesCount===1){if(dest&&dest!==state.pipes)return this;if(!dest)dest=state.pipes;state.pipes=null;state.pipesCount=0;state.flowing=false;if(dest)dest.emit('unpipe',this);return this;}
if(!dest){var dests=state.pipes;var len=state.pipesCount;state.pipes=null;state.pipesCount=0;state.flowing=false;for(var i=0;i<len;i++){dests[i].emit('unpipe',this);}return this;}
var index=indexOf(state.pipes,dest);if(index===-1)return this;state.pipes.splice(index,1);state.pipesCount-=1;if(state.pipesCount===1)state.pipes=state.pipes[0];dest.emit('unpipe',this);return this;};Readable.prototype.on=function(ev,fn){var res=Stream.prototype.on.call(this,ev,fn);if(ev==='data'){if(this._readableState.flowing!==false)this.resume();}else if(ev==='readable'){var state=this._readableState;if(!state.endEmitted&&!state.readableListening){state.readableListening=state.needReadable=true;state.emittedReadable=false;if(!state.reading){processNextTick(nReadingNextTick,this);}else if(state.length){emitReadable(this,state);}}}
return res;};Readable.prototype.addListener=Readable.prototype.on;function nReadingNextTick(self){debug('readable nexttick read 0');self.read(0);}
Readable.prototype.resume=function(){var state=this._readableState;if(!state.flowing){debug('resume');state.flowing=true;resume(this,state);}
return this;};function resume(stream,state){if(!state.resumeScheduled){state.resumeScheduled=true;processNextTick(resume_,stream,state);}}
function resume_(stream,state){if(!state.reading){debug('resume read 0');stream.read(0);}
state.resumeScheduled=false;state.awaitDrain=0;stream.emit('resume');flow(stream);if(state.flowing&&!state.reading)stream.read(0);}
Readable.prototype.pause=function(){debug('call pause flowing=%j',this._readableState.flowing);if(false!==this._readableState.flowing){debug('pause');this._readableState.flowing=false;this.emit('pause');}
return this;};function flow(stream){var state=stream._readableState;debug('flow',state.flowing);while(state.flowing&&stream.read()!==null){}}
Readable.prototype.wrap=function(stream){var state=this._readableState;var paused=false;var self=this;stream.on('end',function(){debug('wrapped end');if(state.decoder&&!state.ended){var chunk=state.decoder.end();if(chunk&&chunk.length)self.push(chunk);}
self.push(null);});stream.on('data',function(chunk){debug('wrapped data');if(state.decoder)chunk=state.decoder.write(chunk);if(state.objectMode&&(chunk===null||chunk===undefined))return;else if(!state.objectMode&&(!chunk||!chunk.length))return;var ret=self.push(chunk);if(!ret){paused=true;stream.pause();}});for(var i in stream){if(this[i]===undefined&&typeof stream[i]==='function'){this[i]=function(method){return function(){return stream[method].apply(stream,arguments);};}(i);}}
var events=['error','close','destroy','pause','resume'];forEach(events,function(ev){stream.on(ev,self.emit.bind(self,ev));});self._read=function(n){debug('wrapped _read',n);if(paused){paused=false;stream.resume();}};return self;};Readable._fromList=fromList;function fromList(n,state){if(state.length===0)return null;var ret;if(state.objectMode)ret=state.buffer.shift();else if(!n||n>=state.length){if(state.decoder)ret=state.buffer.join('');else if(state.buffer.length===1)ret=state.buffer.head.data;else ret=state.buffer.concat(state.length);state.buffer.clear();}else{ret=fromListPartial(n,state.buffer,state.decoder);}
return ret;}
function fromListPartial(n,list,hasStrings){var ret;if(n<list.head.data.length){ret=list.head.data.slice(0,n);list.head.data=list.head.data.slice(n);}else if(n===list.head.data.length){ret=list.shift();}else{ret=hasStrings?copyFromBufferString(n,list):copyFromBuffer(n,list);}
return ret;}
function copyFromBufferString(n,list){var p=list.head;var c=1;var ret=p.data;n-=ret.length;while(p=p.next){var str=p.data;var nb=n>str.length?str.length:n;if(nb===str.length)ret+=str;else ret+=str.slice(0,n);n-=nb;if(n===0){if(nb===str.length){++c;if(p.next)list.head=p.next;else list.head=list.tail=null;}else{list.head=p;p.data=str.slice(nb);}
break;}
++c;}
list.length-=c;return ret;}
function copyFromBuffer(n,list){var ret=bufferShim.allocUnsafe(n);var p=list.head;var c=1;p.data.copy(ret);n-=p.data.length;while(p=p.next){var buf=p.data;var nb=n>buf.length?buf.length:n;buf.copy(ret,ret.length-n,0,nb);n-=nb;if(n===0){if(nb===buf.length){++c;if(p.next)list.head=p.next;else list.head=list.tail=null;}else{list.head=p;p.data=buf.slice(nb);}
break;}
++c;}
list.length-=c;return ret;}
function endReadable(stream){var state=stream._readableState;if(state.length>0)throw new Error('"endReadable()" called on non-empty stream');if(!state.endEmitted){state.ended=true;processNextTick(endReadableNT,state,stream);}}
function endReadableNT(state,stream){if(!state.endEmitted&&state.length===0){state.endEmitted=true;stream.readable=false;stream.emit('end');}}
function forEach(xs,f){for(var i=0,l=xs.length;i<l;i++){f(xs[i],i);}}
function indexOf(xs,x){for(var i=0,l=xs.length;i<l;i++){if(xs[i]===x)return i;}
return-1;}}).call(this,require('_process'))},{"./_stream_duplex":140,"./internal/streams/BufferList":145,"_process":138,"buffer":77,"buffer-shims":76,"core-util-is":78,"events":79,"inherits":81,"isarray":83,"process-nextick-args":137,"string_decoder/":152,"util":75}],143:[function(require,module,exports){'use strict';module.exports=Transform;var Duplex=require('./_stream_duplex');var util=require('core-util-is');util.inherits=require('inherits');util.inherits(Transform,Duplex);function TransformState(stream){this.afterTransform=function(er,data){return afterTransform(stream,er,data);};this.needTransform=false;this.transforming=false;this.writecb=null;this.writechunk=null;this.writeencoding=null;}
function afterTransform(stream,er,data){var ts=stream._transformState;ts.transforming=false;var cb=ts.writecb;if(!cb)return stream.emit('error',new Error('no writecb in Transform class'));ts.writechunk=null;ts.writecb=null;if(data!==null&&data!==undefined)stream.push(data);cb(er);var rs=stream._readableState;rs.reading=false;if(rs.needReadable||rs.length<rs.highWaterMark){stream._read(rs.highWaterMark);}}
function Transform(options){if(!(this instanceof Transform))return new Transform(options);Duplex.call(this,options);this._transformState=new TransformState(this);var stream=this;this._readableState.needReadable=true;this._readableState.sync=false;if(options){if(typeof options.transform==='function')this._transform=options.transform;if(typeof options.flush==='function')this._flush=options.flush;}
this.once('prefinish',function(){if(typeof this._flush==='function')this._flush(function(er,data){done(stream,er,data);});else done(stream);});}
Transform.prototype.push=function(chunk,encoding){this._transformState.needTransform=false;return Duplex.prototype.push.call(this,chunk,encoding);};Transform.prototype._transform=function(chunk,encoding,cb){throw new Error('_transform() is not implemented');};Transform.prototype._write=function(chunk,encoding,cb){var ts=this._transformState;ts.writecb=cb;ts.writechunk=chunk;ts.writeencoding=encoding;if(!ts.transforming){var rs=this._readableState;if(ts.needTransform||rs.needReadable||rs.length<rs.highWaterMark)this._read(rs.highWaterMark);}};Transform.prototype._read=function(n){var ts=this._transformState;if(ts.writechunk!==null&&ts.writecb&&!ts.transforming){ts.transforming=true;this._transform(ts.writechunk,ts.writeencoding,ts.afterTransform);}else{ts.needTransform=true;}};function done(stream,er,data){if(er)return stream.emit('error',er);if(data!==null&&data!==undefined)stream.push(data);var ws=stream._writableState;var ts=stream._transformState;if(ws.length)throw new Error('Calling transform done when ws.length != 0');if(ts.transforming)throw new Error('Calling transform done when still transforming');return stream.push(null);}},{"./_stream_duplex":140,"core-util-is":78,"inherits":81}],144:[function(require,module,exports){(function(process){'use strict';module.exports=Writable;var processNextTick=require('process-nextick-args');var asyncWrite=!process.browser&&['v0.10','v0.9.'].indexOf(process.version.slice(0,5))>-1?setImmediate:processNextTick;var Duplex;Writable.WritableState=WritableState;var util=require('core-util-is');util.inherits=require('inherits');var internalUtil={deprecate:require('util-deprecate')};var Stream;(function(){try{Stream=require('st'+'ream');}catch(_){}finally{if(!Stream)Stream=require('events').EventEmitter;}})();var Buffer=require('buffer').Buffer;var bufferShim=require('buffer-shims');util.inherits(Writable,Stream);function nop(){}
function WriteReq(chunk,encoding,cb){this.chunk=chunk;this.encoding=encoding;this.callback=cb;this.next=null;}
function WritableState(options,stream){Duplex=Duplex||require('./_stream_duplex');options=options||{};this.objectMode=!!options.objectMode;if(stream instanceof Duplex)this.objectMode=this.objectMode||!!options.writableObjectMode;var hwm=options.highWaterMark;var defaultHwm=this.objectMode?16:16*1024;this.highWaterMark=hwm||hwm===0?hwm:defaultHwm;this.highWaterMark=~~this.highWaterMark;this.needDrain=false;this.ending=false;this.ended=false;this.finished=false;var noDecode=options.decodeStrings===false;this.decodeStrings=!noDecode;this.defaultEncoding=options.defaultEncoding||'utf8';this.length=0;this.writing=false;this.corked=0;this.sync=true;this.bufferProcessing=false;this.onwrite=function(er){onwrite(stream,er);};this.writecb=null;this.writelen=0;this.bufferedRequest=null;this.lastBufferedRequest=null;this.pendingcb=0;this.prefinished=false;this.errorEmitted=false;this.bufferedRequestCount=0;this.corkedRequestsFree=new CorkedRequest(this);}
WritableState.prototype.getBuffer=function getBuffer(){var current=this.bufferedRequest;var out=[];while(current){out.push(current);current=current.next;}
return out;};(function(){try{Object.defineProperty(WritableState.prototype,'buffer',{get:internalUtil.deprecate(function(){return this.getBuffer();},'_writableState.buffer is deprecated. Use _writableState.getBuffer '+'instead.')});}catch(_){}})();var realHasInstance;if(typeof Symbol==='function'&&Symbol.hasInstance&&typeof Function.prototype[Symbol.hasInstance]==='function'){realHasInstance=Function.prototype[Symbol.hasInstance];Object.defineProperty(Writable,Symbol.hasInstance,{value:function(object){if(realHasInstance.call(this,object))return true;return object&&object._writableState instanceof WritableState;}});}else{realHasInstance=function(object){return object instanceof this;};}
function Writable(options){Duplex=Duplex||require('./_stream_duplex');if(!realHasInstance.call(Writable,this)&&!(this instanceof Duplex)){return new Writable(options);}
this._writableState=new WritableState(options,this);this.writable=true;if(options){if(typeof options.write==='function')this._write=options.write;if(typeof options.writev==='function')this._writev=options.writev;}
Stream.call(this);}
Writable.prototype.pipe=function(){this.emit('error',new Error('Cannot pipe, not readable'));};function writeAfterEnd(stream,cb){var er=new Error('write after end');stream.emit('error',er);processNextTick(cb,er);}
function validChunk(stream,state,chunk,cb){var valid=true;var er=false;if(chunk===null){er=new TypeError('May not write null values to stream');}else if(typeof chunk!=='string'&&chunk!==undefined&&!state.objectMode){er=new TypeError('Invalid non-string/buffer chunk');}
if(er){stream.emit('error',er);processNextTick(cb,er);valid=false;}
return valid;}
Writable.prototype.write=function(chunk,encoding,cb){var state=this._writableState;var ret=false;var isBuf=Buffer.isBuffer(chunk);if(typeof encoding==='function'){cb=encoding;encoding=null;}
if(isBuf)encoding='buffer';else if(!encoding)encoding=state.defaultEncoding;if(typeof cb!=='function')cb=nop;if(state.ended)writeAfterEnd(this,cb);else if(isBuf||validChunk(this,state,chunk,cb)){state.pendingcb++;ret=writeOrBuffer(this,state,isBuf,chunk,encoding,cb);}
return ret;};Writable.prototype.cork=function(){var state=this._writableState;state.corked++;};Writable.prototype.uncork=function(){var state=this._writableState;if(state.corked){state.corked--;if(!state.writing&&!state.corked&&!state.finished&&!state.bufferProcessing&&state.bufferedRequest)clearBuffer(this,state);}};Writable.prototype.setDefaultEncoding=function setDefaultEncoding(encoding){if(typeof encoding==='string')encoding=encoding.toLowerCase();if(!(['hex','utf8','utf-8','ascii','binary','base64','ucs2','ucs-2','utf16le','utf-16le','raw'].indexOf((encoding+'').toLowerCase())>-1))throw new TypeError('Unknown encoding: '+encoding);this._writableState.defaultEncoding=encoding;return this;};function decodeChunk(state,chunk,encoding){if(!state.objectMode&&state.decodeStrings!==false&&typeof chunk==='string'){chunk=bufferShim.from(chunk,encoding);}
return chunk;}
function writeOrBuffer(stream,state,isBuf,chunk,encoding,cb){if(!isBuf){chunk=decodeChunk(state,chunk,encoding);if(Buffer.isBuffer(chunk))encoding='buffer';}
var len=state.objectMode?1:chunk.length;state.length+=len;var ret=state.length<state.highWaterMark;if(!ret)state.needDrain=true;if(state.writing||state.corked){var last=state.lastBufferedRequest;state.lastBufferedRequest=new WriteReq(chunk,encoding,cb);if(last){last.next=state.lastBufferedRequest;}else{state.bufferedRequest=state.lastBufferedRequest;}
state.bufferedRequestCount+=1;}else{doWrite(stream,state,false,len,chunk,encoding,cb);}
return ret;}
function doWrite(stream,state,writev,len,chunk,encoding,cb){state.writelen=len;state.writecb=cb;state.writing=true;state.sync=true;if(writev)stream._writev(chunk,state.onwrite);else stream._write(chunk,encoding,state.onwrite);state.sync=false;}
function onwriteError(stream,state,sync,er,cb){--state.pendingcb;if(sync)processNextTick(cb,er);else cb(er);stream._writableState.errorEmitted=true;stream.emit('error',er);}
function onwriteStateUpdate(state){state.writing=false;state.writecb=null;state.length-=state.writelen;state.writelen=0;}
function onwrite(stream,er){var state=stream._writableState;var sync=state.sync;var cb=state.writecb;onwriteStateUpdate(state);if(er)onwriteError(stream,state,sync,er,cb);else{var finished=needFinish(state);if(!finished&&!state.corked&&!state.bufferProcessing&&state.bufferedRequest){clearBuffer(stream,state);}
if(sync){asyncWrite(afterWrite,stream,state,finished,cb);}else{afterWrite(stream,state,finished,cb);}}}
function afterWrite(stream,state,finished,cb){if(!finished)onwriteDrain(stream,state);state.pendingcb--;cb();finishMaybe(stream,state);}
function onwriteDrain(stream,state){if(state.length===0&&state.needDrain){state.needDrain=false;stream.emit('drain');}}
function clearBuffer(stream,state){state.bufferProcessing=true;var entry=state.bufferedRequest;if(stream._writev&&entry&&entry.next){var l=state.bufferedRequestCount;var buffer=new Array(l);var holder=state.corkedRequestsFree;holder.entry=entry;var count=0;while(entry){buffer[count]=entry;entry=entry.next;count+=1;}
doWrite(stream,state,true,state.length,buffer,'',holder.finish);state.pendingcb++;state.lastBufferedRequest=null;if(holder.next){state.corkedRequestsFree=holder.next;holder.next=null;}else{state.corkedRequestsFree=new CorkedRequest(state);}}else{while(entry){var chunk=entry.chunk;var encoding=entry.encoding;var cb=entry.callback;var len=state.objectMode?1:chunk.length;doWrite(stream,state,false,len,chunk,encoding,cb);entry=entry.next;if(state.writing){break;}}
if(entry===null)state.lastBufferedRequest=null;}
state.bufferedRequestCount=0;state.bufferedRequest=entry;state.bufferProcessing=false;}
Writable.prototype._write=function(chunk,encoding,cb){cb(new Error('_write() is not implemented'));};Writable.prototype._writev=null;Writable.prototype.end=function(chunk,encoding,cb){var state=this._writableState;if(typeof chunk==='function'){cb=chunk;chunk=null;encoding=null;}else if(typeof encoding==='function'){cb=encoding;encoding=null;}
if(chunk!==null&&chunk!==undefined)this.write(chunk,encoding);if(state.corked){state.corked=1;this.uncork();}
if(!state.ending&&!state.finished)endWritable(this,state,cb);};function needFinish(state){return state.ending&&state.length===0&&state.bufferedRequest===null&&!state.finished&&!state.writing;}
function prefinish(stream,state){if(!state.prefinished){state.prefinished=true;stream.emit('prefinish');}}
function finishMaybe(stream,state){var need=needFinish(state);if(need){if(state.pendingcb===0){prefinish(stream,state);state.finished=true;stream.emit('finish');}else{prefinish(stream,state);}}
return need;}
function endWritable(stream,state,cb){state.ending=true;finishMaybe(stream,state);if(cb){if(state.finished)processNextTick(cb);else stream.once('finish',cb);}
state.ended=true;stream.writable=false;}
function CorkedRequest(state){var _this=this;this.next=null;this.entry=null;this.finish=function(err){var entry=_this.entry;_this.entry=null;while(entry){var cb=entry.callback;state.pendingcb--;cb(err);entry=entry.next;}
if(state.corkedRequestsFree){state.corkedRequestsFree.next=_this;}else{state.corkedRequestsFree=_this;}};}}).call(this,require('_process'))},{"./_stream_duplex":140,"_process":138,"buffer":77,"buffer-shims":76,"core-util-is":78,"events":79,"inherits":81,"process-nextick-args":137,"util-deprecate":154}],145:[function(require,module,exports){'use strict';var Buffer=require('buffer').Buffer;var bufferShim=require('buffer-shims');module.exports=BufferList;function BufferList(){this.head=null;this.tail=null;this.length=0;}
BufferList.prototype.push=function(v){var entry={data:v,next:null};if(this.length>0)this.tail.next=entry;else this.head=entry;this.tail=entry;++this.length;};BufferList.prototype.unshift=function(v){var entry={data:v,next:this.head};if(this.length===0)this.tail=entry;this.head=entry;++this.length;};BufferList.prototype.shift=function(){if(this.length===0)return;var ret=this.head.data;if(this.length===1)this.head=this.tail=null;else this.head=this.head.next;--this.length;return ret;};BufferList.prototype.clear=function(){this.head=this.tail=null;this.length=0;};BufferList.prototype.join=function(s){if(this.length===0)return '';var p=this.head;var ret=''+p.data;while(p=p.next){ret+=s+p.data;}return ret;};BufferList.prototype.concat=function(n){if(this.length===0)return bufferShim.alloc(0);if(this.length===1)return this.head.data;var ret=bufferShim.allocUnsafe(n>>>0);var p=this.head;var i=0;while(p){p.data.copy(ret,i);i+=p.data.length;p=p.next;}
return ret;};},{"buffer":77,"buffer-shims":76}],146:[function(require,module,exports){module.exports=require("./lib/_stream_passthrough.js")},{"./lib/_stream_passthrough.js":141}],147:[function(require,module,exports){(function(process){var Stream=(function(){try{return require('st'+'ream');}catch(_){}}());exports=module.exports=require('./lib/_stream_readable.js');exports.Stream=Stream||exports;exports.Readable=exports;exports.Writable=require('./lib/_stream_writable.js');exports.Duplex=require('./lib/_stream_duplex.js');exports.Transform=require('./lib/_stream_transform.js');exports.PassThrough=require('./lib/_stream_passthrough.js');if(!process.browser&&process.env.READABLE_STREAM==='disable'&&Stream){module.exports=Stream;}}).call(this,require('_process'))},{"./lib/_stream_duplex.js":140,"./lib/_stream_passthrough.js":141,"./lib/_stream_readable.js":142,"./lib/_stream_transform.js":143,"./lib/_stream_writable.js":144,"_process":138}],148:[function(require,module,exports){module.exports=require("./lib/_stream_transform.js")},{"./lib/_stream_transform.js":143}],149:[function(require,module,exports){module.exports=require("./lib/_stream_writable.js")},{"./lib/_stream_writable.js":144}],150:[function(require,module,exports){(function(Buffer){;(function(sax){sax.parser=function(strict,opt){return new SAXParser(strict,opt)}
sax.SAXParser=SAXParser
sax.SAXStream=SAXStream
sax.createStream=createStream
sax.MAX_BUFFER_LENGTH=64*1024
var buffers=['comment','sgmlDecl','textNode','tagName','doctype','procInstName','procInstBody','entity','attribName','attribValue','cdata','script']
sax.EVENTS=['text','processinginstruction','sgmldeclaration','doctype','comment','attribute','opentag','closetag','opencdata','cdata','closecdata','error','end','ready','script','opennamespace','closenamespace']
function SAXParser(strict,opt){if(!(this instanceof SAXParser)){return new SAXParser(strict,opt)}
var parser=this
clearBuffers(parser)
parser.q=parser.c=''
parser.bufferCheckPosition=sax.MAX_BUFFER_LENGTH
parser.opt=opt||{}
parser.opt.lowercase=parser.opt.lowercase||parser.opt.lowercasetags
parser.looseCase=parser.opt.lowercase?'toLowerCase':'toUpperCase'
parser.tags=[]
parser.closed=parser.closedRoot=parser.sawRoot=false
parser.tag=parser.error=null
parser.strict=!!strict
parser.noscript=!!(strict||parser.opt.noscript)
parser.state=S.BEGIN
parser.strictEntities=parser.opt.strictEntities
parser.ENTITIES=parser.strictEntities?Object.create(sax.XML_ENTITIES):Object.create(sax.ENTITIES)
parser.attribList=[]
if(parser.opt.xmlns){parser.ns=Object.create(rootNS)}
parser.trackPosition=parser.opt.position!==false
if(parser.trackPosition){parser.position=parser.line=parser.column=0}
emit(parser,'onready')}
if(!Object.create){Object.create=function(o){function F(){}
F.prototype=o
var newf=new F()
return newf}}
if(!Object.keys){Object.keys=function(o){var a=[]
for(var i in o)if(o.hasOwnProperty(i))a.push(i)
return a}}
function checkBufferLength(parser){var maxAllowed=Math.max(sax.MAX_BUFFER_LENGTH,10)
var maxActual=0
for(var i=0,l=buffers.length;i<l;i++){var len=parser[buffers[i]].length
if(len>maxAllowed){switch(buffers[i]){case 'textNode':closeText(parser)
break
case 'cdata':emitNode(parser,'oncdata',parser.cdata)
parser.cdata=''
break
case 'script':emitNode(parser,'onscript',parser.script)
parser.script=''
break
default:error(parser,'Max buffer length exceeded: '+buffers[i])}}
maxActual=Math.max(maxActual,len)}
var m=sax.MAX_BUFFER_LENGTH-maxActual
parser.bufferCheckPosition=m+parser.position}
function clearBuffers(parser){for(var i=0,l=buffers.length;i<l;i++){parser[buffers[i]]=''}}
function flushBuffers(parser){closeText(parser)
if(parser.cdata!==''){emitNode(parser,'oncdata',parser.cdata)
parser.cdata=''}
if(parser.script!==''){emitNode(parser,'onscript',parser.script)
parser.script=''}}
SAXParser.prototype={end:function(){end(this)},write:write,resume:function(){this.error=null;return this},close:function(){return this.write(null)},flush:function(){flushBuffers(this)}}
var Stream
try{Stream=require('stream').Stream}catch(ex){Stream=function(){}}
var streamWraps=sax.EVENTS.filter(function(ev){return ev!=='error'&&ev!=='end'})
function createStream(strict,opt){return new SAXStream(strict,opt)}
function SAXStream(strict,opt){if(!(this instanceof SAXStream)){return new SAXStream(strict,opt)}
Stream.apply(this)
this._parser=new SAXParser(strict,opt)
this.writable=true
this.readable=true
var me=this
this._parser.onend=function(){me.emit('end')}
this._parser.onerror=function(er){me.emit('error',er)
me._parser.error=null}
this._decoder=null
streamWraps.forEach(function(ev){Object.defineProperty(me,'on'+ev,{get:function(){return me._parser['on'+ev]},set:function(h){if(!h){me.removeAllListeners(ev)
me._parser['on'+ev]=h
return h}
me.on(ev,h)},enumerable:true,configurable:false})})}
SAXStream.prototype=Object.create(Stream.prototype,{constructor:{value:SAXStream}})
SAXStream.prototype.write=function(data){if(typeof Buffer==='function'&&typeof Buffer.isBuffer==='function'&&Buffer.isBuffer(data)){if(!this._decoder){var SD=require('string_decoder').StringDecoder
this._decoder=new SD('utf8')}
data=this._decoder.write(data)}
this._parser.write(data.toString())
this.emit('data',data)
return true}
SAXStream.prototype.end=function(chunk){if(chunk&&chunk.length){this.write(chunk)}
this._parser.end()
return true}
SAXStream.prototype.on=function(ev,handler){var me=this
if(!me._parser['on'+ev]&&streamWraps.indexOf(ev)!==-1){me._parser['on'+ev]=function(){var args=arguments.length===1?[arguments[0]]:Array.apply(null,arguments)
args.splice(0,0,ev)
me.emit.apply(me,args)}}
return Stream.prototype.on.call(me,ev,handler)}
var whitespace='\r\n\t '
var number='0124356789'
var letter='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
var quote='\'"'
var attribEnd=whitespace+'>'
var CDATA='[CDATA['
var DOCTYPE='DOCTYPE'
var XML_NAMESPACE='http://www.w3.org/XML/1998/namespace'
var XMLNS_NAMESPACE='http://www.w3.org/2000/xmlns/'
var rootNS={xml:XML_NAMESPACE,xmlns:XMLNS_NAMESPACE}
whitespace=charClass(whitespace)
number=charClass(number)
letter=charClass(letter)
var nameStart=/[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
var nameBody=/[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/
var entityStart=/[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
var entityBody=/[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/
quote=charClass(quote)
attribEnd=charClass(attribEnd)
function charClass(str){return str.split('').reduce(function(s,c){s[c]=true
return s},{})}
function isRegExp(c){return Object.prototype.toString.call(c)==='[object RegExp]'}
function is(charclass,c){return isRegExp(charclass)?!!c.match(charclass):charclass[c]}
function not(charclass,c){return!is(charclass,c)}
var S=0
sax.STATE={BEGIN:S++,BEGIN_WHITESPACE:S++,TEXT:S++,TEXT_ENTITY:S++,OPEN_WAKA:S++,SGML_DECL:S++,SGML_DECL_QUOTED:S++,DOCTYPE:S++,DOCTYPE_QUOTED:S++,DOCTYPE_DTD:S++,DOCTYPE_DTD_QUOTED:S++,COMMENT_STARTING:S++,COMMENT:S++,COMMENT_ENDING:S++,COMMENT_ENDED:S++,CDATA:S++,CDATA_ENDING:S++,CDATA_ENDING_2:S++,PROC_INST:S++,PROC_INST_BODY:S++,PROC_INST_ENDING:S++,OPEN_TAG:S++,OPEN_TAG_SLASH:S++,ATTRIB:S++,ATTRIB_NAME:S++,ATTRIB_NAME_SAW_WHITE:S++,ATTRIB_VALUE:S++,ATTRIB_VALUE_QUOTED:S++,ATTRIB_VALUE_CLOSED:S++,ATTRIB_VALUE_UNQUOTED:S++,ATTRIB_VALUE_ENTITY_Q:S++,ATTRIB_VALUE_ENTITY_U:S++,CLOSE_TAG:S++,CLOSE_TAG_SAW_WHITE:S++,SCRIPT:S++,SCRIPT_ENDING:S++}
sax.XML_ENTITIES={'amp':'&','gt':'>','lt':'<','quot':'"','apos':"'"}
sax.ENTITIES={'amp':'&','gt':'>','lt':'<','quot':'"','apos':"'",'AElig':198,'Aacute':193,'Acirc':194,'Agrave':192,'Aring':197,'Atilde':195,'Auml':196,'Ccedil':199,'ETH':208,'Eacute':201,'Ecirc':202,'Egrave':200,'Euml':203,'Iacute':205,'Icirc':206,'Igrave':204,'Iuml':207,'Ntilde':209,'Oacute':211,'Ocirc':212,'Ograve':210,'Oslash':216,'Otilde':213,'Ouml':214,'THORN':222,'Uacute':218,'Ucirc':219,'Ugrave':217,'Uuml':220,'Yacute':221,'aacute':225,'acirc':226,'aelig':230,'agrave':224,'aring':229,'atilde':227,'auml':228,'ccedil':231,'eacute':233,'ecirc':234,'egrave':232,'eth':240,'euml':235,'iacute':237,'icirc':238,'igrave':236,'iuml':239,'ntilde':241,'oacute':243,'ocirc':244,'ograve':242,'oslash':248,'otilde':245,'ouml':246,'szlig':223,'thorn':254,'uacute':250,'ucirc':251,'ugrave':249,'uuml':252,'yacute':253,'yuml':255,'copy':169,'reg':174,'nbsp':160,'iexcl':161,'cent':162,'pound':163,'curren':164,'yen':165,'brvbar':166,'sect':167,'uml':168,'ordf':170,'laquo':171,'not':172,'shy':173,'macr':175,'deg':176,'plusmn':177,'sup1':185,'sup2':178,'sup3':179,'acute':180,'micro':181,'para':182,'middot':183,'cedil':184,'ordm':186,'raquo':187,'frac14':188,'frac12':189,'frac34':190,'iquest':191,'times':215,'divide':247,'OElig':338,'oelig':339,'Scaron':352,'scaron':353,'Yuml':376,'fnof':402,'circ':710,'tilde':732,'Alpha':913,'Beta':914,'Gamma':915,'Delta':916,'Epsilon':917,'Zeta':918,'Eta':919,'Theta':920,'Iota':921,'Kappa':922,'Lambda':923,'Mu':924,'Nu':925,'Xi':926,'Omicron':927,'Pi':928,'Rho':929,'Sigma':931,'Tau':932,'Upsilon':933,'Phi':934,'Chi':935,'Psi':936,'Omega':937,'alpha':945,'beta':946,'gamma':947,'delta':948,'epsilon':949,'zeta':950,'eta':951,'theta':952,'iota':953,'kappa':954,'lambda':955,'mu':956,'nu':957,'xi':958,'omicron':959,'pi':960,'rho':961,'sigmaf':962,'sigma':963,'tau':964,'upsilon':965,'phi':966,'chi':967,'psi':968,'omega':969,'thetasym':977,'upsih':978,'piv':982,'ensp':8194,'emsp':8195,'thinsp':8201,'zwnj':8204,'zwj':8205,'lrm':8206,'rlm':8207,'ndash':8211,'mdash':8212,'lsquo':8216,'rsquo':8217,'sbquo':8218,'ldquo':8220,'rdquo':8221,'bdquo':8222,'dagger':8224,'Dagger':8225,'bull':8226,'hellip':8230,'permil':8240,'prime':8242,'Prime':8243,'lsaquo':8249,'rsaquo':8250,'oline':8254,'frasl':8260,'euro':8364,'image':8465,'weierp':8472,'real':8476,'trade':8482,'alefsym':8501,'larr':8592,'uarr':8593,'rarr':8594,'darr':8595,'harr':8596,'crarr':8629,'lArr':8656,'uArr':8657,'rArr':8658,'dArr':8659,'hArr':8660,'forall':8704,'part':8706,'exist':8707,'empty':8709,'nabla':8711,'isin':8712,'notin':8713,'ni':8715,'prod':8719,'sum':8721,'minus':8722,'lowast':8727,'radic':8730,'prop':8733,'infin':8734,'ang':8736,'and':8743,'or':8744,'cap':8745,'cup':8746,'int':8747,'there4':8756,'sim':8764,'cong':8773,'asymp':8776,'ne':8800,'equiv':8801,'le':8804,'ge':8805,'sub':8834,'sup':8835,'nsub':8836,'sube':8838,'supe':8839,'oplus':8853,'otimes':8855,'perp':8869,'sdot':8901,'lceil':8968,'rceil':8969,'lfloor':8970,'rfloor':8971,'lang':9001,'rang':9002,'loz':9674,'spades':9824,'clubs':9827,'hearts':9829,'diams':9830}
Object.keys(sax.ENTITIES).forEach(function(key){var e=sax.ENTITIES[key]
var s=typeof e==='number'?String.fromCharCode(e):e
sax.ENTITIES[key]=s})
for(var s in sax.STATE){sax.STATE[sax.STATE[s]]=s}
S=sax.STATE
function emit(parser,event,data){parser[event]&&parser[event](data)}
function emitNode(parser,nodeType,data){if(parser.textNode)closeText(parser)
emit(parser,nodeType,data)}
function closeText(parser){parser.textNode=textopts(parser.opt,parser.textNode)
if(parser.textNode)emit(parser,'ontext',parser.textNode)
parser.textNode=''}
function textopts(opt,text){if(opt.trim)text=text.trim()
if(opt.normalize)text=text.replace(/\s+/g,' ')
return text}
function error(parser,er){closeText(parser)
if(parser.trackPosition){er+='\nLine: '+parser.line+
'\nColumn: '+parser.column+
'\nChar: '+parser.c}
er=new Error(er)
parser.error=er
emit(parser,'onerror',er)
return parser}
function end(parser){if(parser.sawRoot&&!parser.closedRoot)strictFail(parser,'Unclosed root tag')
if((parser.state!==S.BEGIN)&&(parser.state!==S.BEGIN_WHITESPACE)&&(parser.state!==S.TEXT)){error(parser,'Unexpected end')}
closeText(parser)
parser.c=''
parser.closed=true
emit(parser,'onend')
SAXParser.call(parser,parser.strict,parser.opt)
return parser}
function strictFail(parser,message){if(typeof parser!=='object'||!(parser instanceof SAXParser)){throw new Error('bad call to strictFail')}
if(parser.strict){error(parser,message)}}
function newTag(parser){if(!parser.strict)parser.tagName=parser.tagName[parser.looseCase]()
var parent=parser.tags[parser.tags.length-1]||parser
var tag=parser.tag={name:parser.tagName,attributes:{}}
if(parser.opt.xmlns){tag.ns=parent.ns}
parser.attribList.length=0}
function qname(name,attribute){var i=name.indexOf(':')
var qualName=i<0?['',name]:name.split(':')
var prefix=qualName[0]
var local=qualName[1]
if(attribute&&name==='xmlns'){prefix='xmlns'
local=''}
return{prefix:prefix,local:local}}
function attrib(parser){if(!parser.strict){parser.attribName=parser.attribName[parser.looseCase]()}
if(parser.attribList.indexOf(parser.attribName)!==-1||parser.tag.attributes.hasOwnProperty(parser.attribName)){parser.attribName=parser.attribValue=''
return}
if(parser.opt.xmlns){var qn=qname(parser.attribName,true)
var prefix=qn.prefix
var local=qn.local
if(prefix==='xmlns'){if(local==='xml'&&parser.attribValue!==XML_NAMESPACE){strictFail(parser,'xml: prefix must be bound to '+XML_NAMESPACE+'\n'+
'Actual: '+parser.attribValue)}else if(local==='xmlns'&&parser.attribValue!==XMLNS_NAMESPACE){strictFail(parser,'xmlns: prefix must be bound to '+XMLNS_NAMESPACE+'\n'+
'Actual: '+parser.attribValue)}else{var tag=parser.tag
var parent=parser.tags[parser.tags.length-1]||parser
if(tag.ns===parent.ns){tag.ns=Object.create(parent.ns)}
tag.ns[local]=parser.attribValue}}
parser.attribList.push([parser.attribName,parser.attribValue])}else{parser.tag.attributes[parser.attribName]=parser.attribValue
emitNode(parser,'onattribute',{name:parser.attribName,value:parser.attribValue})}
parser.attribName=parser.attribValue=''}
function openTag(parser,selfClosing){if(parser.opt.xmlns){var tag=parser.tag
var qn=qname(parser.tagName)
tag.prefix=qn.prefix
tag.local=qn.local
tag.uri=tag.ns[qn.prefix]||''
if(tag.prefix&&!tag.uri){strictFail(parser,'Unbound namespace prefix: '+
JSON.stringify(parser.tagName))
tag.uri=qn.prefix}
var parent=parser.tags[parser.tags.length-1]||parser
if(tag.ns&&parent.ns!==tag.ns){Object.keys(tag.ns).forEach(function(p){emitNode(parser,'onopennamespace',{prefix:p,uri:tag.ns[p]})})}
for(var i=0,l=parser.attribList.length;i<l;i++){var nv=parser.attribList[i]
var name=nv[0]
var value=nv[1]
var qualName=qname(name,true)
var prefix=qualName.prefix
var local=qualName.local
var uri=prefix===''?'':(tag.ns[prefix]||'')
var a={name:name,value:value,prefix:prefix,local:local,uri:uri}
if(prefix&&prefix!=='xmlns'&&!uri){strictFail(parser,'Unbound namespace prefix: '+
JSON.stringify(prefix))
a.uri=prefix}
parser.tag.attributes[name]=a
emitNode(parser,'onattribute',a)}
parser.attribList.length=0}
parser.tag.isSelfClosing=!!selfClosing
parser.sawRoot=true
parser.tags.push(parser.tag)
emitNode(parser,'onopentag',parser.tag)
if(!selfClosing){if(!parser.noscript&&parser.tagName.toLowerCase()==='script'){parser.state=S.SCRIPT}else{parser.state=S.TEXT}
parser.tag=null
parser.tagName=''}
parser.attribName=parser.attribValue=''
parser.attribList.length=0}
function closeTag(parser){if(!parser.tagName){strictFail(parser,'Weird empty close tag.')
parser.textNode+='</>'
parser.state=S.TEXT
return}
if(parser.script){if(parser.tagName!=='script'){parser.script+='</'+parser.tagName+'>'
parser.tagName=''
parser.state=S.SCRIPT
return}
emitNode(parser,'onscript',parser.script)
parser.script=''}
var t=parser.tags.length
var tagName=parser.tagName
if(!parser.strict){tagName=tagName[parser.looseCase]()}
var closeTo=tagName
while(t--){var close=parser.tags[t]
if(close.name!==closeTo){strictFail(parser,'Unexpected close tag')}else{break}}
if(t<0){strictFail(parser,'Unmatched closing tag: '+parser.tagName)
parser.textNode+='</'+parser.tagName+'>'
parser.state=S.TEXT
return}
parser.tagName=tagName
var s=parser.tags.length
while(s-->t){var tag=parser.tag=parser.tags.pop()
parser.tagName=parser.tag.name
emitNode(parser,'onclosetag',parser.tagName)
var x={}
for(var i in tag.ns){x[i]=tag.ns[i]}
var parent=parser.tags[parser.tags.length-1]||parser
if(parser.opt.xmlns&&tag.ns!==parent.ns){Object.keys(tag.ns).forEach(function(p){var n=tag.ns[p]
emitNode(parser,'onclosenamespace',{prefix:p,uri:n})})}}
if(t===0)parser.closedRoot=true
parser.tagName=parser.attribValue=parser.attribName=''
parser.attribList.length=0
parser.state=S.TEXT}
function parseEntity(parser){var entity=parser.entity
var entityLC=entity.toLowerCase()
var num
var numStr=''
if(parser.ENTITIES[entity]){return parser.ENTITIES[entity]}
if(parser.ENTITIES[entityLC]){return parser.ENTITIES[entityLC]}
entity=entityLC
if(entity.charAt(0)==='#'){if(entity.charAt(1)==='x'){entity=entity.slice(2)
num=parseInt(entity,16)
numStr=num.toString(16)}else{entity=entity.slice(1)
num=parseInt(entity,10)
numStr=num.toString(10)}}
entity=entity.replace(/^0+/,'')
if(numStr.toLowerCase()!==entity){strictFail(parser,'Invalid character entity')
return '&'+parser.entity+';'}
return String.fromCodePoint(num)}
function beginWhiteSpace(parser,c){if(c==='<'){parser.state=S.OPEN_WAKA
parser.startTagPosition=parser.position}else if(not(whitespace,c)){strictFail(parser,'Non-whitespace before first tag.')
parser.textNode=c
parser.state=S.TEXT}}
function charAt(chunk,i){var result=''
if(i<chunk.length){result=chunk.charAt(i)}
return result}
function write(chunk){var parser=this
if(this.error){throw this.error}
if(parser.closed){return error(parser,'Cannot write after close. Assign an onready handler.')}
if(chunk===null){return end(parser)}
if(typeof chunk==='object'){chunk=chunk.toString()}
var i=0
var c=''
while(true){c=charAt(chunk,i++)
parser.c=c
if(!c){break}
if(parser.trackPosition){parser.position++
if(c==='\n'){parser.line++
parser.column=0}else{parser.column++}}
switch(parser.state){case S.BEGIN:parser.state=S.BEGIN_WHITESPACE
if(c==='\uFEFF'){continue}
beginWhiteSpace(parser,c)
continue
case S.BEGIN_WHITESPACE:beginWhiteSpace(parser,c)
continue
case S.TEXT:if(parser.sawRoot&&!parser.closedRoot){var starti=i-1
while(c&&c!=='<'&&c!=='&'){c=charAt(chunk,i++)
if(c&&parser.trackPosition){parser.position++
if(c==='\n'){parser.line++
parser.column=0}else{parser.column++}}}
parser.textNode+=chunk.substring(starti,i-1)}
if(c==='<'&&!(parser.sawRoot&&parser.closedRoot&&!parser.strict)){parser.state=S.OPEN_WAKA
parser.startTagPosition=parser.position}else{if(not(whitespace,c)&&(!parser.sawRoot||parser.closedRoot)){strictFail(parser,'Text data outside of root node.')}
if(c==='&'){parser.state=S.TEXT_ENTITY}else{parser.textNode+=c}}
continue
case S.SCRIPT:if(c==='<'){parser.state=S.SCRIPT_ENDING}else{parser.script+=c}
continue
case S.SCRIPT_ENDING:if(c==='/'){parser.state=S.CLOSE_TAG}else{parser.script+='<'+c
parser.state=S.SCRIPT}
continue
case S.OPEN_WAKA:if(c==='!'){parser.state=S.SGML_DECL
parser.sgmlDecl=''}else if(is(whitespace,c)){}else if(is(nameStart,c)){parser.state=S.OPEN_TAG
parser.tagName=c}else if(c==='/'){parser.state=S.CLOSE_TAG
parser.tagName=''}else if(c==='?'){parser.state=S.PROC_INST
parser.procInstName=parser.procInstBody=''}else{strictFail(parser,'Unencoded <')
if(parser.startTagPosition+1<parser.position){var pad=parser.position-parser.startTagPosition
c=new Array(pad).join(' ')+c}
parser.textNode+='<'+c
parser.state=S.TEXT}
continue
case S.SGML_DECL:if((parser.sgmlDecl+c).toUpperCase()===CDATA){emitNode(parser,'onopencdata')
parser.state=S.CDATA
parser.sgmlDecl=''
parser.cdata=''}else if(parser.sgmlDecl+c==='--'){parser.state=S.COMMENT
parser.comment=''
parser.sgmlDecl=''}else if((parser.sgmlDecl+c).toUpperCase()===DOCTYPE){parser.state=S.DOCTYPE
if(parser.doctype||parser.sawRoot){strictFail(parser,'Inappropriately located doctype declaration')}
parser.doctype=''
parser.sgmlDecl=''}else if(c==='>'){emitNode(parser,'onsgmldeclaration',parser.sgmlDecl)
parser.sgmlDecl=''
parser.state=S.TEXT}else if(is(quote,c)){parser.state=S.SGML_DECL_QUOTED
parser.sgmlDecl+=c}else{parser.sgmlDecl+=c}
continue
case S.SGML_DECL_QUOTED:if(c===parser.q){parser.state=S.SGML_DECL
parser.q=''}
parser.sgmlDecl+=c
continue
case S.DOCTYPE:if(c==='>'){parser.state=S.TEXT
emitNode(parser,'ondoctype',parser.doctype)
parser.doctype=true}else{parser.doctype+=c
if(c==='['){parser.state=S.DOCTYPE_DTD}else if(is(quote,c)){parser.state=S.DOCTYPE_QUOTED
parser.q=c}}
continue
case S.DOCTYPE_QUOTED:parser.doctype+=c
if(c===parser.q){parser.q=''
parser.state=S.DOCTYPE}
continue
case S.DOCTYPE_DTD:parser.doctype+=c
if(c===']'){parser.state=S.DOCTYPE}else if(is(quote,c)){parser.state=S.DOCTYPE_DTD_QUOTED
parser.q=c}
continue
case S.DOCTYPE_DTD_QUOTED:parser.doctype+=c
if(c===parser.q){parser.state=S.DOCTYPE_DTD
parser.q=''}
continue
case S.COMMENT:if(c==='-'){parser.state=S.COMMENT_ENDING}else{parser.comment+=c}
continue
case S.COMMENT_ENDING:if(c==='-'){parser.state=S.COMMENT_ENDED
parser.comment=textopts(parser.opt,parser.comment)
if(parser.comment){emitNode(parser,'oncomment',parser.comment)}
parser.comment=''}else{parser.comment+='-'+c
parser.state=S.COMMENT}
continue
case S.COMMENT_ENDED:if(c!=='>'){strictFail(parser,'Malformed comment')
parser.comment+='--'+c
parser.state=S.COMMENT}else{parser.state=S.TEXT}
continue
case S.CDATA:if(c===']'){parser.state=S.CDATA_ENDING}else{parser.cdata+=c}
continue
case S.CDATA_ENDING:if(c===']'){parser.state=S.CDATA_ENDING_2}else{parser.cdata+=']'+c
parser.state=S.CDATA}
continue
case S.CDATA_ENDING_2:if(c==='>'){if(parser.cdata){emitNode(parser,'oncdata',parser.cdata)}
emitNode(parser,'onclosecdata')
parser.cdata=''
parser.state=S.TEXT}else if(c===']'){parser.cdata+=']'}else{parser.cdata+=']]'+c
parser.state=S.CDATA}
continue
case S.PROC_INST:if(c==='?'){parser.state=S.PROC_INST_ENDING}else if(is(whitespace,c)){parser.state=S.PROC_INST_BODY}else{parser.procInstName+=c}
continue
case S.PROC_INST_BODY:if(!parser.procInstBody&&is(whitespace,c)){continue}else if(c==='?'){parser.state=S.PROC_INST_ENDING}else{parser.procInstBody+=c}
continue
case S.PROC_INST_ENDING:if(c==='>'){emitNode(parser,'onprocessinginstruction',{name:parser.procInstName,body:parser.procInstBody})
parser.procInstName=parser.procInstBody=''
parser.state=S.TEXT}else{parser.procInstBody+='?'+c
parser.state=S.PROC_INST_BODY}
continue
case S.OPEN_TAG:if(is(nameBody,c)){parser.tagName+=c}else{newTag(parser)
if(c==='>'){openTag(parser)}else if(c==='/'){parser.state=S.OPEN_TAG_SLASH}else{if(not(whitespace,c)){strictFail(parser,'Invalid character in tag name')}
parser.state=S.ATTRIB}}
continue
case S.OPEN_TAG_SLASH:if(c==='>'){openTag(parser,true)
closeTag(parser)}else{strictFail(parser,'Forward-slash in opening tag not followed by >')
parser.state=S.ATTRIB}
continue
case S.ATTRIB:if(is(whitespace,c)){continue}else if(c==='>'){openTag(parser)}else if(c==='/'){parser.state=S.OPEN_TAG_SLASH}else if(is(nameStart,c)){parser.attribName=c
parser.attribValue=''
parser.state=S.ATTRIB_NAME}else{strictFail(parser,'Invalid attribute name')}
continue
case S.ATTRIB_NAME:if(c==='='){parser.state=S.ATTRIB_VALUE}else if(c==='>'){strictFail(parser,'Attribute without value')
parser.attribValue=parser.attribName
attrib(parser)
openTag(parser)}else if(is(whitespace,c)){parser.state=S.ATTRIB_NAME_SAW_WHITE}else if(is(nameBody,c)){parser.attribName+=c}else{strictFail(parser,'Invalid attribute name')}
continue
case S.ATTRIB_NAME_SAW_WHITE:if(c==='='){parser.state=S.ATTRIB_VALUE}else if(is(whitespace,c)){continue}else{strictFail(parser,'Attribute without value')
parser.tag.attributes[parser.attribName]=''
parser.attribValue=''
emitNode(parser,'onattribute',{name:parser.attribName,value:''})
parser.attribName=''
if(c==='>'){openTag(parser)}else if(is(nameStart,c)){parser.attribName=c
parser.state=S.ATTRIB_NAME}else{strictFail(parser,'Invalid attribute name')
parser.state=S.ATTRIB}}
continue
case S.ATTRIB_VALUE:if(is(whitespace,c)){continue}else if(is(quote,c)){parser.q=c
parser.state=S.ATTRIB_VALUE_QUOTED}else{strictFail(parser,'Unquoted attribute value')
parser.state=S.ATTRIB_VALUE_UNQUOTED
parser.attribValue=c}
continue
case S.ATTRIB_VALUE_QUOTED:if(c!==parser.q){if(c==='&'){parser.state=S.ATTRIB_VALUE_ENTITY_Q}else{parser.attribValue+=c}
continue}
attrib(parser)
parser.q=''
parser.state=S.ATTRIB_VALUE_CLOSED
continue
case S.ATTRIB_VALUE_CLOSED:if(is(whitespace,c)){parser.state=S.ATTRIB}else if(c==='>'){openTag(parser)}else if(c==='/'){parser.state=S.OPEN_TAG_SLASH}else if(is(nameStart,c)){strictFail(parser,'No whitespace between attributes')
parser.attribName=c
parser.attribValue=''
parser.state=S.ATTRIB_NAME}else{strictFail(parser,'Invalid attribute name')}
continue
case S.ATTRIB_VALUE_UNQUOTED:if(not(attribEnd,c)){if(c==='&'){parser.state=S.ATTRIB_VALUE_ENTITY_U}else{parser.attribValue+=c}
continue}
attrib(parser)
if(c==='>'){openTag(parser)}else{parser.state=S.ATTRIB}
continue
case S.CLOSE_TAG:if(!parser.tagName){if(is(whitespace,c)){continue}else if(not(nameStart,c)){if(parser.script){parser.script+='</'+c
parser.state=S.SCRIPT}else{strictFail(parser,'Invalid tagname in closing tag.')}}else{parser.tagName=c}}else if(c==='>'){closeTag(parser)}else if(is(nameBody,c)){parser.tagName+=c}else if(parser.script){parser.script+='</'+parser.tagName
parser.tagName=''
parser.state=S.SCRIPT}else{if(not(whitespace,c)){strictFail(parser,'Invalid tagname in closing tag')}
parser.state=S.CLOSE_TAG_SAW_WHITE}
continue
case S.CLOSE_TAG_SAW_WHITE:if(is(whitespace,c)){continue}
if(c==='>'){closeTag(parser)}else{strictFail(parser,'Invalid characters in closing tag')}
continue
case S.TEXT_ENTITY:case S.ATTRIB_VALUE_ENTITY_Q:case S.ATTRIB_VALUE_ENTITY_U:var returnState
var buffer
switch(parser.state){case S.TEXT_ENTITY:returnState=S.TEXT
buffer='textNode'
break
case S.ATTRIB_VALUE_ENTITY_Q:returnState=S.ATTRIB_VALUE_QUOTED
buffer='attribValue'
break
case S.ATTRIB_VALUE_ENTITY_U:returnState=S.ATTRIB_VALUE_UNQUOTED
buffer='attribValue'
break}
if(c===';'){parser[buffer]+=parseEntity(parser)
parser.entity=''
parser.state=returnState}else if(is(parser.entity.length?entityBody:entityStart,c)){parser.entity+=c}else{strictFail(parser,'Invalid character in entity name')
parser[buffer]+='&'+parser.entity+c
parser.entity=''
parser.state=returnState}
continue
default:throw new Error(parser,'Unknown state: '+parser.state)}}
if(parser.position>=parser.bufferCheckPosition){checkBufferLength(parser)}
return parser}/*!http://mths.be/fromcodepoint v0.1.0 by @mathias*/
if(!String.fromCodePoint){(function(){var stringFromCharCode=String.fromCharCode
var floor=Math.floor
var fromCodePoint=function(){var MAX_SIZE=0x4000
var codeUnits=[]
var highSurrogate
var lowSurrogate
var index=-1
var length=arguments.length
if(!length){return ''}
var result=''
while(++index<length){var codePoint=Number(arguments[index])
if(!isFinite(codePoint)||codePoint<0||codePoint>0x10FFFF||floor(codePoint)!==codePoint){throw RangeError('Invalid code point: '+codePoint)}
if(codePoint<=0xFFFF){codeUnits.push(codePoint)}else{codePoint-=0x10000
highSurrogate=(codePoint>>10)+0xD800
lowSurrogate=(codePoint%0x400)+0xDC00
codeUnits.push(highSurrogate,lowSurrogate)}
if(index+1===length||codeUnits.length>MAX_SIZE){result+=stringFromCharCode.apply(null,codeUnits)
codeUnits.length=0}}
return result}
if(Object.defineProperty){Object.defineProperty(String,'fromCodePoint',{value:fromCodePoint,configurable:true,writable:true})}else{String.fromCodePoint=fromCodePoint}}())}})(typeof exports==='undefined'?this.sax={}:exports)}).call(this,require("buffer").Buffer)},{"buffer":77,"stream":151,"string_decoder":152}],151:[function(require,module,exports){module.exports=Stream;var EE=require('events').EventEmitter;var inherits=require('inherits');inherits(Stream,EE);Stream.Readable=require('readable-stream/readable.js');Stream.Writable=require('readable-stream/writable.js');Stream.Duplex=require('readable-stream/duplex.js');Stream.Transform=require('readable-stream/transform.js');Stream.PassThrough=require('readable-stream/passthrough.js');Stream.Stream=Stream;function Stream(){EE.call(this);}
Stream.prototype.pipe=function(dest,options){var source=this;function ondata(chunk){if(dest.writable){if(false===dest.write(chunk)&&source.pause){source.pause();}}}
source.on('data',ondata);function ondrain(){if(source.readable&&source.resume){source.resume();}}
dest.on('drain',ondrain);if(!dest._isStdio&&(!options||options.end!==false)){source.on('end',onend);source.on('close',onclose);}
var didOnEnd=false;function onend(){if(didOnEnd)return;didOnEnd=true;dest.end();}
function onclose(){if(didOnEnd)return;didOnEnd=true;if(typeof dest.destroy==='function')dest.destroy();}
function onerror(er){cleanup();if(EE.listenerCount(this,'error')===0){throw er;}}
source.on('error',onerror);dest.on('error',onerror);function cleanup(){source.removeListener('data',ondata);dest.removeListener('drain',ondrain);source.removeListener('end',onend);source.removeListener('close',onclose);source.removeListener('error',onerror);dest.removeListener('error',onerror);source.removeListener('end',cleanup);source.removeListener('close',cleanup);dest.removeListener('close',cleanup);}
source.on('end',cleanup);source.on('close',cleanup);dest.on('close',cleanup);dest.emit('pipe',source);return dest;};},{"events":79,"inherits":81,"readable-stream/duplex.js":139,"readable-stream/passthrough.js":146,"readable-stream/readable.js":147,"readable-stream/transform.js":148,"readable-stream/writable.js":149}],152:[function(require,module,exports){var Buffer=require('buffer').Buffer;var isBufferEncoding=Buffer.isEncoding||function(encoding){switch(encoding&&encoding.toLowerCase()){case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':return true;default:return false;}}
function assertEncoding(encoding){if(encoding&&!isBufferEncoding(encoding)){throw new Error('Unknown encoding: '+encoding);}}
var StringDecoder=exports.StringDecoder=function(encoding){this.encoding=(encoding||'utf8').toLowerCase().replace(/[-_]/,'');assertEncoding(encoding);switch(this.encoding){case 'utf8':this.surrogateSize=3;break;case 'ucs2':case 'utf16le':this.surrogateSize=2;this.detectIncompleteChar=utf16DetectIncompleteChar;break;case 'base64':this.surrogateSize=3;this.detectIncompleteChar=base64DetectIncompleteChar;break;default:this.write=passThroughWrite;return;}
this.charBuffer=new Buffer(6);this.charReceived=0;this.charLength=0;};StringDecoder.prototype.write=function(buffer){var charStr='';while(this.charLength){var available=(buffer.length>=this.charLength-this.charReceived)?this.charLength-this.charReceived:buffer.length;buffer.copy(this.charBuffer,this.charReceived,0,available);this.charReceived+=available;if(this.charReceived<this.charLength){return '';}
buffer=buffer.slice(available,buffer.length);charStr=this.charBuffer.slice(0,this.charLength).toString(this.encoding);var charCode=charStr.charCodeAt(charStr.length-1);if(charCode>=0xD800&&charCode<=0xDBFF){this.charLength+=this.surrogateSize;charStr='';continue;}
this.charReceived=this.charLength=0;if(buffer.length===0){return charStr;}
break;}
this.detectIncompleteChar(buffer);var end=buffer.length;if(this.charLength){buffer.copy(this.charBuffer,0,buffer.length-this.charReceived,end);end-=this.charReceived;}
charStr+=buffer.toString(this.encoding,0,end);var end=charStr.length-1;var charCode=charStr.charCodeAt(end);if(charCode>=0xD800&&charCode<=0xDBFF){var size=this.surrogateSize;this.charLength+=size;this.charReceived+=size;this.charBuffer.copy(this.charBuffer,size,0,size);buffer.copy(this.charBuffer,0,0,size);return charStr.substring(0,end);}
return charStr;};StringDecoder.prototype.detectIncompleteChar=function(buffer){var i=(buffer.length>=3)?3:buffer.length;for(;i>0;i--){var c=buffer[buffer.length-i];if(i==1&&c>>5==0x06){this.charLength=2;break;}
if(i<=2&&c>>4==0x0E){this.charLength=3;break;}
if(i<=3&&c>>3==0x1E){this.charLength=4;break;}}
this.charReceived=i;};StringDecoder.prototype.end=function(buffer){var res='';if(buffer&&buffer.length)
res=this.write(buffer);if(this.charReceived){var cr=this.charReceived;var buf=this.charBuffer;var enc=this.encoding;res+=buf.slice(0,cr).toString(enc);}
return res;};function passThroughWrite(buffer){return buffer.toString(this.encoding);}
function utf16DetectIncompleteChar(buffer){this.charReceived=buffer.length%2;this.charLength=this.charReceived?2:0;}
function base64DetectIncompleteChar(buffer){this.charReceived=buffer.length%3;this.charLength=this.charReceived?3:0;}},{"buffer":77}],153:[function(require,module,exports){(function(){var root=this;var previousUnderscore=root._;var ArrayProto=Array.prototype,ObjProto=Object.prototype,FuncProto=Function.prototype;var
push=ArrayProto.push,slice=ArrayProto.slice,toString=ObjProto.toString,hasOwnProperty=ObjProto.hasOwnProperty;var
nativeIsArray=Array.isArray,nativeKeys=Object.keys,nativeBind=FuncProto.bind,nativeCreate=Object.create;var Ctor=function(){};var _=function(obj){if(obj instanceof _)return obj;if(!(this instanceof _))return new _(obj);this._wrapped=obj;};if(typeof exports!=='undefined'){if(typeof module!=='undefined'&&module.exports){exports=module.exports=_;}
exports._=_;}else{root._=_;}
_.VERSION='1.8.3';var optimizeCb=function(func,context,argCount){if(context===void 0)return func;switch(argCount==null?3:argCount){case 1:return function(value){return func.call(context,value);};case 2:return function(value,other){return func.call(context,value,other);};case 3:return function(value,index,collection){return func.call(context,value,index,collection);};case 4:return function(accumulator,value,index,collection){return func.call(context,accumulator,value,index,collection);};}
return function(){return func.apply(context,arguments);};};var cb=function(value,context,argCount){if(value==null)return _.identity;if(_.isFunction(value))return optimizeCb(value,context,argCount);if(_.isObject(value))return _.matcher(value);return _.property(value);};_.iteratee=function(value,context){return cb(value,context,Infinity);};var createAssigner=function(keysFunc,undefinedOnly){return function(obj){var length=arguments.length;if(length<2||obj==null)return obj;for(var index=1;index<length;index++){var source=arguments[index],keys=keysFunc(source),l=keys.length;for(var i=0;i<l;i++){var key=keys[i];if(!undefinedOnly||obj[key]===void 0)obj[key]=source[key];}}
return obj;};};var baseCreate=function(prototype){if(!_.isObject(prototype))return{};if(nativeCreate)return nativeCreate(prototype);Ctor.prototype=prototype;var result=new Ctor;Ctor.prototype=null;return result;};var property=function(key){return function(obj){return obj==null?void 0:obj[key];};};var MAX_ARRAY_INDEX=Math.pow(2,53)-1;var getLength=property('length');var isArrayLike=function(collection){var length=getLength(collection);return typeof length=='number'&&length>=0&&length<=MAX_ARRAY_INDEX;};_.each=_.forEach=function(obj,iteratee,context){iteratee=optimizeCb(iteratee,context);var i,length;if(isArrayLike(obj)){for(i=0,length=obj.length;i<length;i++){iteratee(obj[i],i,obj);}}else{var keys=_.keys(obj);for(i=0,length=keys.length;i<length;i++){iteratee(obj[keys[i]],keys[i],obj);}}
return obj;};_.map=_.collect=function(obj,iteratee,context){iteratee=cb(iteratee,context);var keys=!isArrayLike(obj)&&_.keys(obj),length=(keys||obj).length,results=Array(length);for(var index=0;index<length;index++){var currentKey=keys?keys[index]:index;results[index]=iteratee(obj[currentKey],currentKey,obj);}
return results;};function createReduce(dir){function iterator(obj,iteratee,memo,keys,index,length){for(;index>=0&&index<length;index+=dir){var currentKey=keys?keys[index]:index;memo=iteratee(memo,obj[currentKey],currentKey,obj);}
return memo;}
return function(obj,iteratee,memo,context){iteratee=optimizeCb(iteratee,context,4);var keys=!isArrayLike(obj)&&_.keys(obj),length=(keys||obj).length,index=dir>0?0:length-1;if(arguments.length<3){memo=obj[keys?keys[index]:index];index+=dir;}
return iterator(obj,iteratee,memo,keys,index,length);};}
_.reduce=_.foldl=_.inject=createReduce(1);_.reduceRight=_.foldr=createReduce(-1);_.find=_.detect=function(obj,predicate,context){var key;if(isArrayLike(obj)){key=_.findIndex(obj,predicate,context);}else{key=_.findKey(obj,predicate,context);}
if(key!==void 0&&key!==-1)return obj[key];};_.filter=_.select=function(obj,predicate,context){var results=[];predicate=cb(predicate,context);_.each(obj,function(value,index,list){if(predicate(value,index,list))results.push(value);});return results;};_.reject=function(obj,predicate,context){return _.filter(obj,_.negate(cb(predicate)),context);};_.every=_.all=function(obj,predicate,context){predicate=cb(predicate,context);var keys=!isArrayLike(obj)&&_.keys(obj),length=(keys||obj).length;for(var index=0;index<length;index++){var currentKey=keys?keys[index]:index;if(!predicate(obj[currentKey],currentKey,obj))return false;}
return true;};_.some=_.any=function(obj,predicate,context){predicate=cb(predicate,context);var keys=!isArrayLike(obj)&&_.keys(obj),length=(keys||obj).length;for(var index=0;index<length;index++){var currentKey=keys?keys[index]:index;if(predicate(obj[currentKey],currentKey,obj))return true;}
return false;};_.contains=_.includes=_.include=function(obj,item,fromIndex,guard){if(!isArrayLike(obj))obj=_.values(obj);if(typeof fromIndex!='number'||guard)fromIndex=0;return _.indexOf(obj,item,fromIndex)>=0;};_.invoke=function(obj,method){var args=slice.call(arguments,2);var isFunc=_.isFunction(method);return _.map(obj,function(value){var func=isFunc?method:value[method];return func==null?func:func.apply(value,args);});};_.pluck=function(obj,key){return _.map(obj,_.property(key));};_.where=function(obj,attrs){return _.filter(obj,_.matcher(attrs));};_.findWhere=function(obj,attrs){return _.find(obj,_.matcher(attrs));};_.max=function(obj,iteratee,context){var result=-Infinity,lastComputed=-Infinity,value,computed;if(iteratee==null&&obj!=null){obj=isArrayLike(obj)?obj:_.values(obj);for(var i=0,length=obj.length;i<length;i++){value=obj[i];if(value>result){result=value;}}}else{iteratee=cb(iteratee,context);_.each(obj,function(value,index,list){computed=iteratee(value,index,list);if(computed>lastComputed||computed===-Infinity&&result===-Infinity){result=value;lastComputed=computed;}});}
return result;};_.min=function(obj,iteratee,context){var result=Infinity,lastComputed=Infinity,value,computed;if(iteratee==null&&obj!=null){obj=isArrayLike(obj)?obj:_.values(obj);for(var i=0,length=obj.length;i<length;i++){value=obj[i];if(value<result){result=value;}}}else{iteratee=cb(iteratee,context);_.each(obj,function(value,index,list){computed=iteratee(value,index,list);if(computed<lastComputed||computed===Infinity&&result===Infinity){result=value;lastComputed=computed;}});}
return result;};_.shuffle=function(obj){var set=isArrayLike(obj)?obj:_.values(obj);var length=set.length;var shuffled=Array(length);for(var index=0,rand;index<length;index++){rand=_.random(0,index);if(rand!==index)shuffled[index]=shuffled[rand];shuffled[rand]=set[index];}
return shuffled;};_.sample=function(obj,n,guard){if(n==null||guard){if(!isArrayLike(obj))obj=_.values(obj);return obj[_.random(obj.length-1)];}
return _.shuffle(obj).slice(0,Math.max(0,n));};_.sortBy=function(obj,iteratee,context){iteratee=cb(iteratee,context);return _.pluck(_.map(obj,function(value,index,list){return{value:value,index:index,criteria:iteratee(value,index,list)};}).sort(function(left,right){var a=left.criteria;var b=right.criteria;if(a!==b){if(a>b||a===void 0)return 1;if(a<b||b===void 0)return-1;}
return left.index-right.index;}),'value');};var group=function(behavior){return function(obj,iteratee,context){var result={};iteratee=cb(iteratee,context);_.each(obj,function(value,index){var key=iteratee(value,index,obj);behavior(result,value,key);});return result;};};_.groupBy=group(function(result,value,key){if(_.has(result,key))result[key].push(value);else result[key]=[value];});_.indexBy=group(function(result,value,key){result[key]=value;});_.countBy=group(function(result,value,key){if(_.has(result,key))result[key]++;else result[key]=1;});_.toArray=function(obj){if(!obj)return[];if(_.isArray(obj))return slice.call(obj);if(isArrayLike(obj))return _.map(obj,_.identity);return _.values(obj);};_.size=function(obj){if(obj==null)return 0;return isArrayLike(obj)?obj.length:_.keys(obj).length;};_.partition=function(obj,predicate,context){predicate=cb(predicate,context);var pass=[],fail=[];_.each(obj,function(value,key,obj){(predicate(value,key,obj)?pass:fail).push(value);});return[pass,fail];};_.first=_.head=_.take=function(array,n,guard){if(array==null)return void 0;if(n==null||guard)return array[0];return _.initial(array,array.length-n);};_.initial=function(array,n,guard){return slice.call(array,0,Math.max(0,array.length-(n==null||guard?1:n)));};_.last=function(array,n,guard){if(array==null)return void 0;if(n==null||guard)return array[array.length-1];return _.rest(array,Math.max(0,array.length-n));};_.rest=_.tail=_.drop=function(array,n,guard){return slice.call(array,n==null||guard?1:n);};_.compact=function(array){return _.filter(array,_.identity);};var flatten=function(input,shallow,strict,startIndex){var output=[],idx=0;for(var i=startIndex||0,length=getLength(input);i<length;i++){var value=input[i];if(isArrayLike(value)&&(_.isArray(value)||_.isArguments(value))){if(!shallow)value=flatten(value,shallow,strict);var j=0,len=value.length;output.length+=len;while(j<len){output[idx++]=value[j++];}}else if(!strict){output[idx++]=value;}}
return output;};_.flatten=function(array,shallow){return flatten(array,shallow,false);};_.without=function(array){return _.difference(array,slice.call(arguments,1));};_.uniq=_.unique=function(array,isSorted,iteratee,context){if(!_.isBoolean(isSorted)){context=iteratee;iteratee=isSorted;isSorted=false;}
if(iteratee!=null)iteratee=cb(iteratee,context);var result=[];var seen=[];for(var i=0,length=getLength(array);i<length;i++){var value=array[i],computed=iteratee?iteratee(value,i,array):value;if(isSorted){if(!i||seen!==computed)result.push(value);seen=computed;}else if(iteratee){if(!_.contains(seen,computed)){seen.push(computed);result.push(value);}}else if(!_.contains(result,value)){result.push(value);}}
return result;};_.union=function(){return _.uniq(flatten(arguments,true,true));};_.intersection=function(array){var result=[];var argsLength=arguments.length;for(var i=0,length=getLength(array);i<length;i++){var item=array[i];if(_.contains(result,item))continue;for(var j=1;j<argsLength;j++){if(!_.contains(arguments[j],item))break;}
if(j===argsLength)result.push(item);}
return result;};_.difference=function(array){var rest=flatten(arguments,true,true,1);return _.filter(array,function(value){return!_.contains(rest,value);});};_.zip=function(){return _.unzip(arguments);};_.unzip=function(array){var length=array&&_.max(array,getLength).length||0;var result=Array(length);for(var index=0;index<length;index++){result[index]=_.pluck(array,index);}
return result;};_.object=function(list,values){var result={};for(var i=0,length=getLength(list);i<length;i++){if(values){result[list[i]]=values[i];}else{result[list[i][0]]=list[i][1];}}
return result;};function createPredicateIndexFinder(dir){return function(array,predicate,context){predicate=cb(predicate,context);var length=getLength(array);var index=dir>0?0:length-1;for(;index>=0&&index<length;index+=dir){if(predicate(array[index],index,array))return index;}
return-1;};}
_.findIndex=createPredicateIndexFinder(1);_.findLastIndex=createPredicateIndexFinder(-1);_.sortedIndex=function(array,obj,iteratee,context){iteratee=cb(iteratee,context,1);var value=iteratee(obj);var low=0,high=getLength(array);while(low<high){var mid=Math.floor((low+high)/2);if(iteratee(array[mid])<value)low=mid+1;else high=mid;}
return low;};function createIndexFinder(dir,predicateFind,sortedIndex){return function(array,item,idx){var i=0,length=getLength(array);if(typeof idx=='number'){if(dir>0){i=idx>=0?idx:Math.max(idx+length,i);}else{length=idx>=0?Math.min(idx+1,length):idx+length+1;}}else if(sortedIndex&&idx&&length){idx=sortedIndex(array,item);return array[idx]===item?idx:-1;}
if(item!==item){idx=predicateFind(slice.call(array,i,length),_.isNaN);return idx>=0?idx+i:-1;}
for(idx=dir>0?i:length-1;idx>=0&&idx<length;idx+=dir){if(array[idx]===item)return idx;}
return-1;};}
_.indexOf=createIndexFinder(1,_.findIndex,_.sortedIndex);_.lastIndexOf=createIndexFinder(-1,_.findLastIndex);_.range=function(start,stop,step){if(stop==null){stop=start||0;start=0;}
step=step||1;var length=Math.max(Math.ceil((stop-start)/step),0);var range=Array(length);for(var idx=0;idx<length;idx++,start+=step){range[idx]=start;}
return range;};var executeBound=function(sourceFunc,boundFunc,context,callingContext,args){if(!(callingContext instanceof boundFunc))return sourceFunc.apply(context,args);var self=baseCreate(sourceFunc.prototype);var result=sourceFunc.apply(self,args);if(_.isObject(result))return result;return self;};_.bind=function(func,context){if(nativeBind&&func.bind===nativeBind)return nativeBind.apply(func,slice.call(arguments,1));if(!_.isFunction(func))throw new TypeError('Bind must be called on a function');var args=slice.call(arguments,2);var bound=function(){return executeBound(func,bound,context,this,args.concat(slice.call(arguments)));};return bound;};_.partial=function(func){var boundArgs=slice.call(arguments,1);var bound=function(){var position=0,length=boundArgs.length;var args=Array(length);for(var i=0;i<length;i++){args[i]=boundArgs[i]===_?arguments[position++]:boundArgs[i];}
while(position<arguments.length)args.push(arguments[position++]);return executeBound(func,bound,this,this,args);};return bound;};_.bindAll=function(obj){var i,length=arguments.length,key;if(length<=1)throw new Error('bindAll must be passed function names');for(i=1;i<length;i++){key=arguments[i];obj[key]=_.bind(obj[key],obj);}
return obj;};_.memoize=function(func,hasher){var memoize=function(key){var cache=memoize.cache;var address=''+(hasher?hasher.apply(this,arguments):key);if(!_.has(cache,address))cache[address]=func.apply(this,arguments);return cache[address];};memoize.cache={};return memoize;};_.delay=function(func,wait){var args=slice.call(arguments,2);return setTimeout(function(){return func.apply(null,args);},wait);};_.defer=_.partial(_.delay,_,1);_.throttle=function(func,wait,options){var context,args,result;var timeout=null;var previous=0;if(!options)options={};var later=function(){previous=options.leading===false?0:_.now();timeout=null;result=func.apply(context,args);if(!timeout)context=args=null;};return function(){var now=_.now();if(!previous&&options.leading===false)previous=now;var remaining=wait-(now-previous);context=this;args=arguments;if(remaining<=0||remaining>wait){if(timeout){clearTimeout(timeout);timeout=null;}
previous=now;result=func.apply(context,args);if(!timeout)context=args=null;}else if(!timeout&&options.trailing!==false){timeout=setTimeout(later,remaining);}
return result;};};_.debounce=function(func,wait,immediate){var timeout,args,context,timestamp,result;var later=function(){var last=_.now()-timestamp;if(last<wait&&last>=0){timeout=setTimeout(later,wait-last);}else{timeout=null;if(!immediate){result=func.apply(context,args);if(!timeout)context=args=null;}}};return function(){context=this;args=arguments;timestamp=_.now();var callNow=immediate&&!timeout;if(!timeout)timeout=setTimeout(later,wait);if(callNow){result=func.apply(context,args);context=args=null;}
return result;};};_.wrap=function(func,wrapper){return _.partial(wrapper,func);};_.negate=function(predicate){return function(){return!predicate.apply(this,arguments);};};_.compose=function(){var args=arguments;var start=args.length-1;return function(){var i=start;var result=args[start].apply(this,arguments);while(i--)result=args[i].call(this,result);return result;};};_.after=function(times,func){return function(){if(--times<1){return func.apply(this,arguments);}};};_.before=function(times,func){var memo;return function(){if(--times>0){memo=func.apply(this,arguments);}
if(times<=1)func=null;return memo;};};_.once=_.partial(_.before,2);var hasEnumBug=!{toString:null}.propertyIsEnumerable('toString');var nonEnumerableProps=['valueOf','isPrototypeOf','toString','propertyIsEnumerable','hasOwnProperty','toLocaleString'];function collectNonEnumProps(obj,keys){var nonEnumIdx=nonEnumerableProps.length;var constructor=obj.constructor;var proto=(_.isFunction(constructor)&&constructor.prototype)||ObjProto;var prop='constructor';if(_.has(obj,prop)&&!_.contains(keys,prop))keys.push(prop);while(nonEnumIdx--){prop=nonEnumerableProps[nonEnumIdx];if(prop in obj&&obj[prop]!==proto[prop]&&!_.contains(keys,prop)){keys.push(prop);}}}
_.keys=function(obj){if(!_.isObject(obj))return[];if(nativeKeys)return nativeKeys(obj);var keys=[];for(var key in obj)if(_.has(obj,key))keys.push(key);if(hasEnumBug)collectNonEnumProps(obj,keys);return keys;};_.allKeys=function(obj){if(!_.isObject(obj))return[];var keys=[];for(var key in obj)keys.push(key);if(hasEnumBug)collectNonEnumProps(obj,keys);return keys;};_.values=function(obj){var keys=_.keys(obj);var length=keys.length;var values=Array(length);for(var i=0;i<length;i++){values[i]=obj[keys[i]];}
return values;};_.mapObject=function(obj,iteratee,context){iteratee=cb(iteratee,context);var keys=_.keys(obj),length=keys.length,results={},currentKey;for(var index=0;index<length;index++){currentKey=keys[index];results[currentKey]=iteratee(obj[currentKey],currentKey,obj);}
return results;};_.pairs=function(obj){var keys=_.keys(obj);var length=keys.length;var pairs=Array(length);for(var i=0;i<length;i++){pairs[i]=[keys[i],obj[keys[i]]];}
return pairs;};_.invert=function(obj){var result={};var keys=_.keys(obj);for(var i=0,length=keys.length;i<length;i++){result[obj[keys[i]]]=keys[i];}
return result;};_.functions=_.methods=function(obj){var names=[];for(var key in obj){if(_.isFunction(obj[key]))names.push(key);}
return names.sort();};_.extend=createAssigner(_.allKeys);_.extendOwn=_.assign=createAssigner(_.keys);_.findKey=function(obj,predicate,context){predicate=cb(predicate,context);var keys=_.keys(obj),key;for(var i=0,length=keys.length;i<length;i++){key=keys[i];if(predicate(obj[key],key,obj))return key;}};_.pick=function(object,oiteratee,context){var result={},obj=object,iteratee,keys;if(obj==null)return result;if(_.isFunction(oiteratee)){keys=_.allKeys(obj);iteratee=optimizeCb(oiteratee,context);}else{keys=flatten(arguments,false,false,1);iteratee=function(value,key,obj){return key in obj;};obj=Object(obj);}
for(var i=0,length=keys.length;i<length;i++){var key=keys[i];var value=obj[key];if(iteratee(value,key,obj))result[key]=value;}
return result;};_.omit=function(obj,iteratee,context){if(_.isFunction(iteratee)){iteratee=_.negate(iteratee);}else{var keys=_.map(flatten(arguments,false,false,1),String);iteratee=function(value,key){return!_.contains(keys,key);};}
return _.pick(obj,iteratee,context);};_.defaults=createAssigner(_.allKeys,true);_.create=function(prototype,props){var result=baseCreate(prototype);if(props)_.extendOwn(result,props);return result;};_.clone=function(obj){if(!_.isObject(obj))return obj;return _.isArray(obj)?obj.slice():_.extend({},obj);};_.tap=function(obj,interceptor){interceptor(obj);return obj;};_.isMatch=function(object,attrs){var keys=_.keys(attrs),length=keys.length;if(object==null)return!length;var obj=Object(object);for(var i=0;i<length;i++){var key=keys[i];if(attrs[key]!==obj[key]||!(key in obj))return false;}
return true;};var eq=function(a,b,aStack,bStack){if(a===b)return a!==0||1/a===1/b;if(a==null||b==null)return a===b;if(a instanceof _)a=a._wrapped;if(b instanceof _)b=b._wrapped;var className=toString.call(a);if(className!==toString.call(b))return false;switch(className){case '[object RegExp]':case '[object String]':return ''+a===''+b;case '[object Number]':if(+a!==+a)return+b!==+b;return+a===0?1/+a===1/b:+a===+b;case '[object Date]':case '[object Boolean]':return+a===+b;}
var areArrays=className==='[object Array]';if(!areArrays){if(typeof a!='object'||typeof b!='object')return false;var aCtor=a.constructor,bCtor=b.constructor;if(aCtor!==bCtor&&!(_.isFunction(aCtor)&&aCtor instanceof aCtor&&_.isFunction(bCtor)&&bCtor instanceof bCtor)&&('constructor'in a&&'constructor'in b)){return false;}}
aStack=aStack||[];bStack=bStack||[];var length=aStack.length;while(length--){if(aStack[length]===a)return bStack[length]===b;}
aStack.push(a);bStack.push(b);if(areArrays){length=a.length;if(length!==b.length)return false;while(length--){if(!eq(a[length],b[length],aStack,bStack))return false;}}else{var keys=_.keys(a),key;length=keys.length;if(_.keys(b).length!==length)return false;while(length--){key=keys[length];if(!(_.has(b,key)&&eq(a[key],b[key],aStack,bStack)))return false;}}
aStack.pop();bStack.pop();return true;};_.isEqual=function(a,b){return eq(a,b);};_.isEmpty=function(obj){if(obj==null)return true;if(isArrayLike(obj)&&(_.isArray(obj)||_.isString(obj)||_.isArguments(obj)))return obj.length===0;return _.keys(obj).length===0;};_.isElement=function(obj){return!!(obj&&obj.nodeType===1);};_.isArray=nativeIsArray||function(obj){return toString.call(obj)==='[object Array]';};_.isObject=function(obj){var type=typeof obj;return type==='function'||type==='object'&&!!obj;};_.each(['Arguments','Function','String','Number','Date','RegExp','Error'],function(name){_['is'+name]=function(obj){return toString.call(obj)==='[object '+name+']';};});if(!_.isArguments(arguments)){_.isArguments=function(obj){return _.has(obj,'callee');};}
if(typeof /./!='function'&&typeof Int8Array!='object'){_.isFunction=function(obj){return typeof obj=='function'||false;};}
_.isFinite=function(obj){return isFinite(obj)&&!isNaN(parseFloat(obj));};_.isNaN=function(obj){return _.isNumber(obj)&&obj!==+obj;};_.isBoolean=function(obj){return obj===true||obj===false||toString.call(obj)==='[object Boolean]';};_.isNull=function(obj){return obj===null;};_.isUndefined=function(obj){return obj===void 0;};_.has=function(obj,key){return obj!=null&&hasOwnProperty.call(obj,key);};_.noConflict=function(){root._=previousUnderscore;return this;};_.identity=function(value){return value;};_.constant=function(value){return function(){return value;};};_.noop=function(){};_.property=property;_.propertyOf=function(obj){return obj==null?function(){}:function(key){return obj[key];};};_.matcher=_.matches=function(attrs){attrs=_.extendOwn({},attrs);return function(obj){return _.isMatch(obj,attrs);};};_.times=function(n,iteratee,context){var accum=Array(Math.max(0,n));iteratee=optimizeCb(iteratee,context,1);for(var i=0;i<n;i++)accum[i]=iteratee(i);return accum;};_.random=function(min,max){if(max==null){max=min;min=0;}
return min+Math.floor(Math.random()*(max-min+1));};_.now=Date.now||function(){return new Date().getTime();};var escapeMap={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','`':'&#x60;'};var unescapeMap=_.invert(escapeMap);var createEscaper=function(map){var escaper=function(match){return map[match];};var source='(?:'+_.keys(map).join('|')+')';var testRegexp=RegExp(source);var replaceRegexp=RegExp(source,'g');return function(string){string=string==null?'':''+string;return testRegexp.test(string)?string.replace(replaceRegexp,escaper):string;};};_.escape=createEscaper(escapeMap);_.unescape=createEscaper(unescapeMap);_.result=function(object,property,fallback){var value=object==null?void 0:object[property];if(value===void 0){value=fallback;}
return _.isFunction(value)?value.call(object):value;};var idCounter=0;_.uniqueId=function(prefix){var id=++idCounter+'';return prefix?prefix+id:id;};_.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var noMatch=/(.)^/;var escapes={"'":"'",'\\':'\\','\r':'r','\n':'n','\u2028':'u2028','\u2029':'u2029'};var escaper=/\\|'|\r|\n|\u2028|\u2029/g;var escapeChar=function(match){return '\\'+escapes[match];};_.template=function(text,settings,oldSettings){if(!settings&&oldSettings)settings=oldSettings;settings=_.defaults({},settings,_.templateSettings);var matcher=RegExp([(settings.escape||noMatch).source,(settings.interpolate||noMatch).source,(settings.evaluate||noMatch).source].join('|')+'|$','g');var index=0;var source="__p+='";text.replace(matcher,function(match,escape,interpolate,evaluate,offset){source+=text.slice(index,offset).replace(escaper,escapeChar);index=offset+match.length;if(escape){source+="'+\n((__t=("+escape+"))==null?'':_.escape(__t))+\n'";}else if(interpolate){source+="'+\n((__t=("+interpolate+"))==null?'':__t)+\n'";}else if(evaluate){source+="';\n"+evaluate+"\n__p+='";}
return match;});source+="';\n";if(!settings.variable)source='with(obj||{}){\n'+source+'}\n';source="var __t,__p='',__j=Array.prototype.join,"+
"print=function(){__p+=__j.call(arguments,'');};\n"+
source+'return __p;\n';try{var render=new Function(settings.variable||'obj','_',source);}catch(e){e.source=source;throw e;}
var template=function(data){return render.call(this,data,_);};var argument=settings.variable||'obj';template.source='function('+argument+'){\n'+source+'}';return template;};_.chain=function(obj){var instance=_(obj);instance._chain=true;return instance;};var result=function(instance,obj){return instance._chain?_(obj).chain():obj;};_.mixin=function(obj){_.each(_.functions(obj),function(name){var func=_[name]=obj[name];_.prototype[name]=function(){var args=[this._wrapped];push.apply(args,arguments);return result(this,func.apply(_,args));};});};_.mixin(_);_.each(['pop','push','reverse','shift','sort','splice','unshift'],function(name){var method=ArrayProto[name];_.prototype[name]=function(){var obj=this._wrapped;method.apply(obj,arguments);if((name==='shift'||name==='splice')&&obj.length===0)delete obj[0];return result(this,obj);};});_.each(['concat','join','slice'],function(name){var method=ArrayProto[name];_.prototype[name]=function(){return result(this,method.apply(this._wrapped,arguments));};});_.prototype.value=function(){return this._wrapped;};_.prototype.valueOf=_.prototype.toJSON=_.prototype.value;_.prototype.toString=function(){return ''+this._wrapped;};if(typeof define==='function'&&define.amd){define('underscore',[],function(){return _;});}}.call(this));},{}],154:[function(require,module,exports){(function(global){module.exports=deprecate;function deprecate(fn,msg){if(config('noDeprecation')){return fn;}
var warned=false;function deprecated(){if(!warned){if(config('throwDeprecation')){throw new Error(msg);}else if(config('traceDeprecation')){console.trace(msg);}else{console.warn(msg);}
warned=true;}
return fn.apply(this,arguments);}
return deprecated;}
function config(name){try{if(!global.localStorage)return false;}catch(_){return false;}
var val=global.localStorage[name];if(null==val)return false;return String(val).toLowerCase()==='true';}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],155:[function(require,module,exports){arguments[4][81][0].apply(exports,arguments)},{"dup":81}],156:[function(require,module,exports){module.exports=function isBuffer(arg){return arg&&typeof arg==='object'&&typeof arg.copy==='function'&&typeof arg.fill==='function'&&typeof arg.readUInt8==='function';}},{}],157:[function(require,module,exports){(function(process,global){var formatRegExp=/%[sdj%]/g;exports.format=function(f){if(!isString(f)){var objects=[];for(var i=0;i<arguments.length;i++){objects.push(inspect(arguments[i]));}
return objects.join(' ');}
var i=1;var args=arguments;var len=args.length;var str=String(f).replace(formatRegExp,function(x){if(x==='%%')return '%';if(i>=len)return x;switch(x){case '%s':return String(args[i++]);case '%d':return Number(args[i++]);case '%j':try{return JSON.stringify(args[i++]);}catch(_){return '[Circular]';}
default:return x;}});for(var x=args[i];i<len;x=args[++i]){if(isNull(x)||!isObject(x)){str+=' '+x;}else{str+=' '+inspect(x);}}
return str;};exports.deprecate=function(fn,msg){if(isUndefined(global.process)){return function(){return exports.deprecate(fn,msg).apply(this,arguments);};}
if(process.noDeprecation===true){return fn;}
var warned=false;function deprecated(){if(!warned){if(process.throwDeprecation){throw new Error(msg);}else if(process.traceDeprecation){console.trace(msg);}else{console.error(msg);}
warned=true;}
return fn.apply(this,arguments);}
return deprecated;};var debugs={};var debugEnviron;exports.debuglog=function(set){if(isUndefined(debugEnviron))
debugEnviron=process.env.NODE_DEBUG||'';set=set.toUpperCase();if(!debugs[set]){if(new RegExp('\\b'+set+'\\b','i').test(debugEnviron)){var pid=process.pid;debugs[set]=function(){var msg=exports.format.apply(exports,arguments);console.error('%s %d: %s',set,pid,msg);};}else{debugs[set]=function(){};}}
return debugs[set];};function inspect(obj,opts){var ctx={seen:[],stylize:stylizeNoColor};if(arguments.length>=3)ctx.depth=arguments[2];if(arguments.length>=4)ctx.colors=arguments[3];if(isBoolean(opts)){ctx.showHidden=opts;}else if(opts){exports._extend(ctx,opts);}
if(isUndefined(ctx.showHidden))ctx.showHidden=false;if(isUndefined(ctx.depth))ctx.depth=2;if(isUndefined(ctx.colors))ctx.colors=false;if(isUndefined(ctx.customInspect))ctx.customInspect=true;if(ctx.colors)ctx.stylize=stylizeWithColor;return formatValue(ctx,obj,ctx.depth);}
exports.inspect=inspect;inspect.colors={'bold':[1,22],'italic':[3,23],'underline':[4,24],'inverse':[7,27],'white':[37,39],'grey':[90,39],'black':[30,39],'blue':[34,39],'cyan':[36,39],'green':[32,39],'magenta':[35,39],'red':[31,39],'yellow':[33,39]};inspect.styles={'special':'cyan','number':'yellow','boolean':'yellow','undefined':'grey','null':'bold','string':'green','date':'magenta','regexp':'red'};function stylizeWithColor(str,styleType){var style=inspect.styles[styleType];if(style){return '\u001b['+inspect.colors[style][0]+'m'+str+
'\u001b['+inspect.colors[style][1]+'m';}else{return str;}}
function stylizeNoColor(str,styleType){return str;}
function arrayToHash(array){var hash={};array.forEach(function(val,idx){hash[val]=true;});return hash;}
function formatValue(ctx,value,recurseTimes){if(ctx.customInspect&&value&&isFunction(value.inspect)&&value.inspect!==exports.inspect&&!(value.constructor&&value.constructor.prototype===value)){var ret=value.inspect(recurseTimes,ctx);if(!isString(ret)){ret=formatValue(ctx,ret,recurseTimes);}
return ret;}
var primitive=formatPrimitive(ctx,value);if(primitive){return primitive;}
var keys=Object.keys(value);var visibleKeys=arrayToHash(keys);if(ctx.showHidden){keys=Object.getOwnPropertyNames(value);}
if(isError(value)&&(keys.indexOf('message')>=0||keys.indexOf('description')>=0)){return formatError(value);}
if(keys.length===0){if(isFunction(value)){var name=value.name?': '+value.name:'';return ctx.stylize('[Function'+name+']','special');}
if(isRegExp(value)){return ctx.stylize(RegExp.prototype.toString.call(value),'regexp');}
if(isDate(value)){return ctx.stylize(Date.prototype.toString.call(value),'date');}
if(isError(value)){return formatError(value);}}
var base='',array=false,braces=['{','}'];if(isArray(value)){array=true;braces=['[',']'];}
if(isFunction(value)){var n=value.name?': '+value.name:'';base=' [Function'+n+']';}
if(isRegExp(value)){base=' '+RegExp.prototype.toString.call(value);}
if(isDate(value)){base=' '+Date.prototype.toUTCString.call(value);}
if(isError(value)){base=' '+formatError(value);}
if(keys.length===0&&(!array||value.length==0)){return braces[0]+base+braces[1];}
if(recurseTimes<0){if(isRegExp(value)){return ctx.stylize(RegExp.prototype.toString.call(value),'regexp');}else{return ctx.stylize('[Object]','special');}}
ctx.seen.push(value);var output;if(array){output=formatArray(ctx,value,recurseTimes,visibleKeys,keys);}else{output=keys.map(function(key){return formatProperty(ctx,value,recurseTimes,visibleKeys,key,array);});}
ctx.seen.pop();return reduceToSingleString(output,base,braces);}
function formatPrimitive(ctx,value){if(isUndefined(value))
return ctx.stylize('undefined','undefined');if(isString(value)){var simple='\''+JSON.stringify(value).replace(/^"|"$/g,'').replace(/'/g,"\\'").replace(/\\"/g,'"')+'\'';return ctx.stylize(simple,'string');}
if(isNumber(value))
return ctx.stylize(''+value,'number');if(isBoolean(value))
return ctx.stylize(''+value,'boolean');if(isNull(value))
return ctx.stylize('null','null');}
function formatError(value){return '['+Error.prototype.toString.call(value)+']';}
function formatArray(ctx,value,recurseTimes,visibleKeys,keys){var output=[];for(var i=0,l=value.length;i<l;++i){if(hasOwnProperty(value,String(i))){output.push(formatProperty(ctx,value,recurseTimes,visibleKeys,String(i),true));}else{output.push('');}}
keys.forEach(function(key){if(!key.match(/^\d+$/)){output.push(formatProperty(ctx,value,recurseTimes,visibleKeys,key,true));}});return output;}
function formatProperty(ctx,value,recurseTimes,visibleKeys,key,array){var name,str,desc;desc=Object.getOwnPropertyDescriptor(value,key)||{value:value[key]};if(desc.get){if(desc.set){str=ctx.stylize('[Getter/Setter]','special');}else{str=ctx.stylize('[Getter]','special');}}else{if(desc.set){str=ctx.stylize('[Setter]','special');}}
if(!hasOwnProperty(visibleKeys,key)){name='['+key+']';}
if(!str){if(ctx.seen.indexOf(desc.value)<0){if(isNull(recurseTimes)){str=formatValue(ctx,desc.value,null);}else{str=formatValue(ctx,desc.value,recurseTimes-1);}
if(str.indexOf('\n')>-1){if(array){str=str.split('\n').map(function(line){return '  '+line;}).join('\n').substr(2);}else{str='\n'+str.split('\n').map(function(line){return '   '+line;}).join('\n');}}}else{str=ctx.stylize('[Circular]','special');}}
if(isUndefined(name)){if(array&&key.match(/^\d+$/)){return str;}
name=JSON.stringify(''+key);if(name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)){name=name.substr(1,name.length-2);name=ctx.stylize(name,'name');}else{name=name.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'");name=ctx.stylize(name,'string');}}
return name+': '+str;}
function reduceToSingleString(output,base,braces){var numLinesEst=0;var length=output.reduce(function(prev,cur){numLinesEst++;if(cur.indexOf('\n')>=0)numLinesEst++;return prev+cur.replace(/\u001b\[\d\d?m/g,'').length+1;},0);if(length>60){return braces[0]+
(base===''?'':base+'\n ')+
' '+
output.join(',\n  ')+
' '+
braces[1];}
return braces[0]+base+' '+output.join(', ')+' '+braces[1];}
function isArray(ar){return Array.isArray(ar);}
exports.isArray=isArray;function isBoolean(arg){return typeof arg==='boolean';}
exports.isBoolean=isBoolean;function isNull(arg){return arg===null;}
exports.isNull=isNull;function isNullOrUndefined(arg){return arg==null;}
exports.isNullOrUndefined=isNullOrUndefined;function isNumber(arg){return typeof arg==='number';}
exports.isNumber=isNumber;function isString(arg){return typeof arg==='string';}
exports.isString=isString;function isSymbol(arg){return typeof arg==='symbol';}
exports.isSymbol=isSymbol;function isUndefined(arg){return arg===void 0;}
exports.isUndefined=isUndefined;function isRegExp(re){return isObject(re)&&objectToString(re)==='[object RegExp]';}
exports.isRegExp=isRegExp;function isObject(arg){return typeof arg==='object'&&arg!==null;}
exports.isObject=isObject;function isDate(d){return isObject(d)&&objectToString(d)==='[object Date]';}
exports.isDate=isDate;function isError(e){return isObject(e)&&(objectToString(e)==='[object Error]'||e instanceof Error);}
exports.isError=isError;function isFunction(arg){return typeof arg==='function';}
exports.isFunction=isFunction;function isPrimitive(arg){return arg===null||typeof arg==='boolean'||typeof arg==='number'||typeof arg==='string'||typeof arg==='symbol'||typeof arg==='undefined';}
exports.isPrimitive=isPrimitive;exports.isBuffer=require('./support/isBuffer');function objectToString(o){return Object.prototype.toString.call(o);}
function pad(n){return n<10?'0'+n.toString(10):n.toString(10);}
var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];function timestamp(){var d=new Date();var time=[pad(d.getHours()),pad(d.getMinutes()),pad(d.getSeconds())].join(':');return[d.getDate(),months[d.getMonth()],time].join(' ');}
exports.log=function(){console.log('%s - %s',timestamp(),exports.format.apply(exports,arguments));};exports.inherits=require('inherits');exports._extend=function(origin,add){if(!add||!isObject(add))return origin;var keys=Object.keys(add);var i=keys.length;while(i--){origin[keys[i]]=add[keys[i]];}
return origin;};function hasOwnProperty(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop);}}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./support/isBuffer":156,"_process":138,"inherits":155}],158:[function(require,module,exports){(function(){var assign,getValue,isArray,isEmpty,isFunction,isObject,isPlainObject,slice=[].slice,hasProp={}.hasOwnProperty;assign=function(){var i,key,len,source,sources,target;target=arguments[0],sources=2<=arguments.length?slice.call(arguments,1):[];if(isFunction(Object.assign)){Object.assign.apply(null,arguments);}else{for(i=0,len=sources.length;i<len;i++){source=sources[i];if(source!=null){for(key in source){if(!hasProp.call(source,key))continue;target[key]=source[key];}}}}
return target;};isFunction=function(val){return!!val&&Object.prototype.toString.call(val)==='[object Function]';};isObject=function(val){var ref;return!!val&&((ref=typeof val)==='function'||ref==='object');};isArray=function(val){if(isFunction(Array.isArray)){return Array.isArray(val);}else{return Object.prototype.toString.call(val)==='[object Array]';}};isEmpty=function(val){var key;if(isArray(val)){return!val.length;}else{for(key in val){if(!hasProp.call(val,key))continue;return false;}
return true;}};isPlainObject=function(val){var ctor,proto;return isObject(val)&&(proto=Object.getPrototypeOf(val))&&(ctor=proto.constructor)&&(typeof ctor==='function')&&(ctor instanceof ctor)&&(Function.prototype.toString.call(ctor)===Function.prototype.toString.call(Object));};getValue=function(obj){if(isFunction(obj.valueOf)){return obj.valueOf();}else{return obj;}};module.exports.assign=assign;module.exports.isFunction=isFunction;module.exports.isObject=isObject;module.exports.isArray=isArray;module.exports.isEmpty=isEmpty;module.exports.isPlainObject=isPlainObject;module.exports.getValue=getValue;}).call(this);},{}],159:[function(require,module,exports){(function(){var XMLAttribute;module.exports=XMLAttribute=(function(){function XMLAttribute(parent,name,value){this.options=parent.options;this.stringify=parent.stringify;this.parent=parent;if(name==null){throw new Error("Missing attribute name. "+this.debugInfo(name));}
if(value==null){throw new Error("Missing attribute value. "+this.debugInfo(name));}
this.name=this.stringify.attName(name);this.value=this.stringify.attValue(value);}
XMLAttribute.prototype.clone=function(){return Object.create(this);};XMLAttribute.prototype.toString=function(options){return this.options.writer.set(options).attribute(this);};XMLAttribute.prototype.debugInfo=function(name){var ref,ref1;name=name||this.name;if((name==null)&&!((ref=this.parent)!=null?ref.name:void 0)){return "";}else if(name==null){return "parent: <"+this.parent.name+">";}else if(!((ref1=this.parent)!=null?ref1.name:void 0)){return "attribute: {"+name+"}";}else{return "attribute: {"+name+"}, parent: <"+this.parent.name+">";}};return XMLAttribute;})();}).call(this);},{}],160:[function(require,module,exports){(function(){var XMLCData,XMLNode,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLCData=(function(superClass){extend(XMLCData,superClass);function XMLCData(parent,text){XMLCData.__super__.constructor.call(this,parent);if(text==null){throw new Error("Missing CDATA text. "+this.debugInfo());}
this.text=this.stringify.cdata(text);}
XMLCData.prototype.clone=function(){return Object.create(this);};XMLCData.prototype.toString=function(options){return this.options.writer.set(options).cdata(this);};return XMLCData;})(XMLNode);}).call(this);},{"./XMLNode":171}],161:[function(require,module,exports){(function(){var XMLComment,XMLNode,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLComment=(function(superClass){extend(XMLComment,superClass);function XMLComment(parent,text){XMLComment.__super__.constructor.call(this,parent);if(text==null){throw new Error("Missing comment text. "+this.debugInfo());}
this.text=this.stringify.comment(text);}
XMLComment.prototype.clone=function(){return Object.create(this);};XMLComment.prototype.toString=function(options){return this.options.writer.set(options).comment(this);};return XMLComment;})(XMLNode);}).call(this);},{"./XMLNode":171}],162:[function(require,module,exports){(function(){var XMLDTDAttList,XMLNode,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLDTDAttList=(function(superClass){extend(XMLDTDAttList,superClass);function XMLDTDAttList(parent,elementName,attributeName,attributeType,defaultValueType,defaultValue){XMLDTDAttList.__super__.constructor.call(this,parent);if(elementName==null){throw new Error("Missing DTD element name. "+this.debugInfo());}
if(attributeName==null){throw new Error("Missing DTD attribute name. "+this.debugInfo(elementName));}
if(!attributeType){throw new Error("Missing DTD attribute type. "+this.debugInfo(elementName));}
if(!defaultValueType){throw new Error("Missing DTD attribute default. "+this.debugInfo(elementName));}
if(defaultValueType.indexOf('#')!==0){defaultValueType='#'+defaultValueType;}
if(!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)){throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. "+this.debugInfo(elementName));}
if(defaultValue&&!defaultValueType.match(/^(#FIXED|#DEFAULT)$/)){throw new Error("Default value only applies to #FIXED or #DEFAULT. "+this.debugInfo(elementName));}
this.elementName=this.stringify.eleName(elementName);this.attributeName=this.stringify.attName(attributeName);this.attributeType=this.stringify.dtdAttType(attributeType);this.defaultValue=this.stringify.dtdAttDefault(defaultValue);this.defaultValueType=defaultValueType;}
XMLDTDAttList.prototype.toString=function(options){return this.options.writer.set(options).dtdAttList(this);};return XMLDTDAttList;})(XMLNode);}).call(this);},{"./XMLNode":171}],163:[function(require,module,exports){(function(){var XMLDTDElement,XMLNode,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLDTDElement=(function(superClass){extend(XMLDTDElement,superClass);function XMLDTDElement(parent,name,value){XMLDTDElement.__super__.constructor.call(this,parent);if(name==null){throw new Error("Missing DTD element name. "+this.debugInfo());}
if(!value){value='(#PCDATA)';}
if(Array.isArray(value)){value='('+value.join(',')+')';}
this.name=this.stringify.eleName(name);this.value=this.stringify.dtdElementValue(value);}
XMLDTDElement.prototype.toString=function(options){return this.options.writer.set(options).dtdElement(this);};return XMLDTDElement;})(XMLNode);}).call(this);},{"./XMLNode":171}],164:[function(require,module,exports){(function(){var XMLDTDEntity,XMLNode,isObject,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;isObject=require('./Utility').isObject;XMLNode=require('./XMLNode');module.exports=XMLDTDEntity=(function(superClass){extend(XMLDTDEntity,superClass);function XMLDTDEntity(parent,pe,name,value){XMLDTDEntity.__super__.constructor.call(this,parent);if(name==null){throw new Error("Missing DTD entity name. "+this.debugInfo(name));}
if(value==null){throw new Error("Missing DTD entity value. "+this.debugInfo(name));}
this.pe=!!pe;this.name=this.stringify.eleName(name);if(!isObject(value)){this.value=this.stringify.dtdEntityValue(value);}else{if(!value.pubID&&!value.sysID){throw new Error("Public and/or system identifiers are required for an external entity. "+this.debugInfo(name));}
if(value.pubID&&!value.sysID){throw new Error("System identifier is required for a public external entity. "+this.debugInfo(name));}
if(value.pubID!=null){this.pubID=this.stringify.dtdPubID(value.pubID);}
if(value.sysID!=null){this.sysID=this.stringify.dtdSysID(value.sysID);}
if(value.nData!=null){this.nData=this.stringify.dtdNData(value.nData);}
if(this.pe&&this.nData){throw new Error("Notation declaration is not allowed in a parameter entity. "+this.debugInfo(name));}}}
XMLDTDEntity.prototype.toString=function(options){return this.options.writer.set(options).dtdEntity(this);};return XMLDTDEntity;})(XMLNode);}).call(this);},{"./Utility":158,"./XMLNode":171}],165:[function(require,module,exports){(function(){var XMLDTDNotation,XMLNode,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLDTDNotation=(function(superClass){extend(XMLDTDNotation,superClass);function XMLDTDNotation(parent,name,value){XMLDTDNotation.__super__.constructor.call(this,parent);if(name==null){throw new Error("Missing DTD notation name. "+this.debugInfo(name));}
if(!value.pubID&&!value.sysID){throw new Error("Public or system identifiers are required for an external entity. "+this.debugInfo(name));}
this.name=this.stringify.eleName(name);if(value.pubID!=null){this.pubID=this.stringify.dtdPubID(value.pubID);}
if(value.sysID!=null){this.sysID=this.stringify.dtdSysID(value.sysID);}}
XMLDTDNotation.prototype.toString=function(options){return this.options.writer.set(options).dtdNotation(this);};return XMLDTDNotation;})(XMLNode);}).call(this);},{"./XMLNode":171}],166:[function(require,module,exports){(function(){var XMLDeclaration,XMLNode,isObject,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;isObject=require('./Utility').isObject;XMLNode=require('./XMLNode');module.exports=XMLDeclaration=(function(superClass){extend(XMLDeclaration,superClass);function XMLDeclaration(parent,version,encoding,standalone){var ref;XMLDeclaration.__super__.constructor.call(this,parent);if(isObject(version)){ref=version,version=ref.version,encoding=ref.encoding,standalone=ref.standalone;}
if(!version){version='1.0';}
this.version=this.stringify.xmlVersion(version);if(encoding!=null){this.encoding=this.stringify.xmlEncoding(encoding);}
if(standalone!=null){this.standalone=this.stringify.xmlStandalone(standalone);}}
XMLDeclaration.prototype.toString=function(options){return this.options.writer.set(options).declaration(this);};return XMLDeclaration;})(XMLNode);}).call(this);},{"./Utility":158,"./XMLNode":171}],167:[function(require,module,exports){(function(){var XMLDTDAttList,XMLDTDElement,XMLDTDEntity,XMLDTDNotation,XMLDocType,XMLNode,isObject,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;isObject=require('./Utility').isObject;XMLNode=require('./XMLNode');XMLDTDAttList=require('./XMLDTDAttList');XMLDTDEntity=require('./XMLDTDEntity');XMLDTDElement=require('./XMLDTDElement');XMLDTDNotation=require('./XMLDTDNotation');module.exports=XMLDocType=(function(superClass){extend(XMLDocType,superClass);function XMLDocType(parent,pubID,sysID){var ref,ref1;XMLDocType.__super__.constructor.call(this,parent);this.name="!DOCTYPE";this.documentObject=parent;if(isObject(pubID)){ref=pubID,pubID=ref.pubID,sysID=ref.sysID;}
if(sysID==null){ref1=[pubID,sysID],sysID=ref1[0],pubID=ref1[1];}
if(pubID!=null){this.pubID=this.stringify.dtdPubID(pubID);}
if(sysID!=null){this.sysID=this.stringify.dtdSysID(sysID);}}
XMLDocType.prototype.element=function(name,value){var child;child=new XMLDTDElement(this,name,value);this.children.push(child);return this;};XMLDocType.prototype.attList=function(elementName,attributeName,attributeType,defaultValueType,defaultValue){var child;child=new XMLDTDAttList(this,elementName,attributeName,attributeType,defaultValueType,defaultValue);this.children.push(child);return this;};XMLDocType.prototype.entity=function(name,value){var child;child=new XMLDTDEntity(this,false,name,value);this.children.push(child);return this;};XMLDocType.prototype.pEntity=function(name,value){var child;child=new XMLDTDEntity(this,true,name,value);this.children.push(child);return this;};XMLDocType.prototype.notation=function(name,value){var child;child=new XMLDTDNotation(this,name,value);this.children.push(child);return this;};XMLDocType.prototype.toString=function(options){return this.options.writer.set(options).docType(this);};XMLDocType.prototype.ele=function(name,value){return this.element(name,value);};XMLDocType.prototype.att=function(elementName,attributeName,attributeType,defaultValueType,defaultValue){return this.attList(elementName,attributeName,attributeType,defaultValueType,defaultValue);};XMLDocType.prototype.ent=function(name,value){return this.entity(name,value);};XMLDocType.prototype.pent=function(name,value){return this.pEntity(name,value);};XMLDocType.prototype.not=function(name,value){return this.notation(name,value);};XMLDocType.prototype.up=function(){return this.root()||this.documentObject;};return XMLDocType;})(XMLNode);}).call(this);},{"./Utility":158,"./XMLDTDAttList":162,"./XMLDTDElement":163,"./XMLDTDEntity":164,"./XMLDTDNotation":165,"./XMLNode":171}],168:[function(require,module,exports){(function(){var XMLDocument,XMLNode,XMLStringWriter,XMLStringifier,isPlainObject,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;isPlainObject=require('./Utility').isPlainObject;XMLNode=require('./XMLNode');XMLStringifier=require('./XMLStringifier');XMLStringWriter=require('./XMLStringWriter');module.exports=XMLDocument=(function(superClass){extend(XMLDocument,superClass);function XMLDocument(options){XMLDocument.__super__.constructor.call(this,null);this.name="?xml";options||(options={});if(!options.writer){options.writer=new XMLStringWriter();}
this.options=options;this.stringify=new XMLStringifier(options);this.isDocument=true;}
XMLDocument.prototype.end=function(writer){var writerOptions;if(!writer){writer=this.options.writer;}else if(isPlainObject(writer)){writerOptions=writer;writer=this.options.writer.set(writerOptions);}
return writer.document(this);};XMLDocument.prototype.toString=function(options){return this.options.writer.set(options).document(this);};return XMLDocument;})(XMLNode);}).call(this);},{"./Utility":158,"./XMLNode":171,"./XMLStringWriter":175,"./XMLStringifier":176}],169:[function(require,module,exports){(function(){var XMLAttribute,XMLCData,XMLComment,XMLDTDAttList,XMLDTDElement,XMLDTDEntity,XMLDTDNotation,XMLDeclaration,XMLDocType,XMLDocumentCB,XMLElement,XMLProcessingInstruction,XMLRaw,XMLStringWriter,XMLStringifier,XMLText,getValue,isFunction,isObject,isPlainObject,ref,hasProp={}.hasOwnProperty;ref=require('./Utility'),isObject=ref.isObject,isFunction=ref.isFunction,isPlainObject=ref.isPlainObject,getValue=ref.getValue;XMLElement=require('./XMLElement');XMLCData=require('./XMLCData');XMLComment=require('./XMLComment');XMLRaw=require('./XMLRaw');XMLText=require('./XMLText');XMLProcessingInstruction=require('./XMLProcessingInstruction');XMLDeclaration=require('./XMLDeclaration');XMLDocType=require('./XMLDocType');XMLDTDAttList=require('./XMLDTDAttList');XMLDTDEntity=require('./XMLDTDEntity');XMLDTDElement=require('./XMLDTDElement');XMLDTDNotation=require('./XMLDTDNotation');XMLAttribute=require('./XMLAttribute');XMLStringifier=require('./XMLStringifier');XMLStringWriter=require('./XMLStringWriter');module.exports=XMLDocumentCB=(function(){function XMLDocumentCB(options,onData,onEnd){var writerOptions;this.name="?xml";options||(options={});if(!options.writer){options.writer=new XMLStringWriter(options);}else if(isPlainObject(options.writer)){writerOptions=options.writer;options.writer=new XMLStringWriter(writerOptions);}
this.options=options;this.writer=options.writer;this.stringify=new XMLStringifier(options);this.onDataCallback=onData||function(){};this.onEndCallback=onEnd||function(){};this.currentNode=null;this.currentLevel=-1;this.openTags={};this.documentStarted=false;this.documentCompleted=false;this.root=null;}
XMLDocumentCB.prototype.node=function(name,attributes,text){var ref1;if(name==null){throw new Error("Missing node name.");}
if(this.root&&this.currentLevel===-1){throw new Error("Document can only have one root node. "+this.debugInfo(name));}
this.openCurrent();name=getValue(name);if(attributes==null){attributes={};}
attributes=getValue(attributes);if(!isObject(attributes)){ref1=[attributes,text],text=ref1[0],attributes=ref1[1];}
this.currentNode=new XMLElement(this,name,attributes);this.currentNode.children=false;this.currentLevel++;this.openTags[this.currentLevel]=this.currentNode;if(text!=null){this.text(text);}
return this;};XMLDocumentCB.prototype.element=function(name,attributes,text){if(this.currentNode&&this.currentNode instanceof XMLDocType){return this.dtdElement.apply(this,arguments);}else{return this.node(name,attributes,text);}};XMLDocumentCB.prototype.attribute=function(name,value){var attName,attValue;if(!this.currentNode||this.currentNode.children){throw new Error("att() can only be used immediately after an ele() call in callback mode. "+this.debugInfo(name));}
if(name!=null){name=getValue(name);}
if(isObject(name)){for(attName in name){if(!hasProp.call(name,attName))continue;attValue=name[attName];this.attribute(attName,attValue);}}else{if(isFunction(value)){value=value.apply();}
if(!this.options.skipNullAttributes||(value!=null)){this.currentNode.attributes[name]=new XMLAttribute(this,name,value);}}
return this;};XMLDocumentCB.prototype.text=function(value){var node;this.openCurrent();node=new XMLText(this,value);this.onData(this.writer.text(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.cdata=function(value){var node;this.openCurrent();node=new XMLCData(this,value);this.onData(this.writer.cdata(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.comment=function(value){var node;this.openCurrent();node=new XMLComment(this,value);this.onData(this.writer.comment(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.raw=function(value){var node;this.openCurrent();node=new XMLRaw(this,value);this.onData(this.writer.raw(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.instruction=function(target,value){var i,insTarget,insValue,len,node;this.openCurrent();if(target!=null){target=getValue(target);}
if(value!=null){value=getValue(value);}
if(Array.isArray(target)){for(i=0,len=target.length;i<len;i++){insTarget=target[i];this.instruction(insTarget);}}else if(isObject(target)){for(insTarget in target){if(!hasProp.call(target,insTarget))continue;insValue=target[insTarget];this.instruction(insTarget,insValue);}}else{if(isFunction(value)){value=value.apply();}
node=new XMLProcessingInstruction(this,target,value);this.onData(this.writer.processingInstruction(node,this.currentLevel+1),this.currentLevel+1);}
return this;};XMLDocumentCB.prototype.declaration=function(version,encoding,standalone){var node;this.openCurrent();if(this.documentStarted){throw new Error("declaration() must be the first node.");}
node=new XMLDeclaration(this,version,encoding,standalone);this.onData(this.writer.declaration(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.doctype=function(root,pubID,sysID){this.openCurrent();if(root==null){throw new Error("Missing root node name.");}
if(this.root){throw new Error("dtd() must come before the root node.");}
this.currentNode=new XMLDocType(this,pubID,sysID);this.currentNode.rootNodeName=root;this.currentNode.children=false;this.currentLevel++;this.openTags[this.currentLevel]=this.currentNode;return this;};XMLDocumentCB.prototype.dtdElement=function(name,value){var node;this.openCurrent();node=new XMLDTDElement(this,name,value);this.onData(this.writer.dtdElement(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.attList=function(elementName,attributeName,attributeType,defaultValueType,defaultValue){var node;this.openCurrent();node=new XMLDTDAttList(this,elementName,attributeName,attributeType,defaultValueType,defaultValue);this.onData(this.writer.dtdAttList(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.entity=function(name,value){var node;this.openCurrent();node=new XMLDTDEntity(this,false,name,value);this.onData(this.writer.dtdEntity(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.pEntity=function(name,value){var node;this.openCurrent();node=new XMLDTDEntity(this,true,name,value);this.onData(this.writer.dtdEntity(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.notation=function(name,value){var node;this.openCurrent();node=new XMLDTDNotation(this,name,value);this.onData(this.writer.dtdNotation(node,this.currentLevel+1),this.currentLevel+1);return this;};XMLDocumentCB.prototype.up=function(){if(this.currentLevel<0){throw new Error("The document node has no parent.");}
if(this.currentNode){if(this.currentNode.children){this.closeNode(this.currentNode);}else{this.openNode(this.currentNode);}
this.currentNode=null;}else{this.closeNode(this.openTags[this.currentLevel]);}
delete this.openTags[this.currentLevel];this.currentLevel--;return this;};XMLDocumentCB.prototype.end=function(){while(this.currentLevel>=0){this.up();}
return this.onEnd();};XMLDocumentCB.prototype.openCurrent=function(){if(this.currentNode){this.currentNode.children=true;return this.openNode(this.currentNode);}};XMLDocumentCB.prototype.openNode=function(node){if(!node.isOpen){if(!this.root&&this.currentLevel===0&&node instanceof XMLElement){this.root=node;}
this.onData(this.writer.openNode(node,this.currentLevel),this.currentLevel);return node.isOpen=true;}};XMLDocumentCB.prototype.closeNode=function(node){if(!node.isClosed){this.onData(this.writer.closeNode(node,this.currentLevel),this.currentLevel);return node.isClosed=true;}};XMLDocumentCB.prototype.onData=function(chunk,level){this.documentStarted=true;return this.onDataCallback(chunk,level+1);};XMLDocumentCB.prototype.onEnd=function(){this.documentCompleted=true;return this.onEndCallback();};XMLDocumentCB.prototype.debugInfo=function(name){if(name==null){return "";}else{return "node: <"+name+">";}};XMLDocumentCB.prototype.ele=function(){return this.element.apply(this,arguments);};XMLDocumentCB.prototype.nod=function(name,attributes,text){return this.node(name,attributes,text);};XMLDocumentCB.prototype.txt=function(value){return this.text(value);};XMLDocumentCB.prototype.dat=function(value){return this.cdata(value);};XMLDocumentCB.prototype.com=function(value){return this.comment(value);};XMLDocumentCB.prototype.ins=function(target,value){return this.instruction(target,value);};XMLDocumentCB.prototype.dec=function(version,encoding,standalone){return this.declaration(version,encoding,standalone);};XMLDocumentCB.prototype.dtd=function(root,pubID,sysID){return this.doctype(root,pubID,sysID);};XMLDocumentCB.prototype.e=function(name,attributes,text){return this.element(name,attributes,text);};XMLDocumentCB.prototype.n=function(name,attributes,text){return this.node(name,attributes,text);};XMLDocumentCB.prototype.t=function(value){return this.text(value);};XMLDocumentCB.prototype.d=function(value){return this.cdata(value);};XMLDocumentCB.prototype.c=function(value){return this.comment(value);};XMLDocumentCB.prototype.r=function(value){return this.raw(value);};XMLDocumentCB.prototype.i=function(target,value){return this.instruction(target,value);};XMLDocumentCB.prototype.att=function(){if(this.currentNode&&this.currentNode instanceof XMLDocType){return this.attList.apply(this,arguments);}else{return this.attribute.apply(this,arguments);}};XMLDocumentCB.prototype.a=function(){if(this.currentNode&&this.currentNode instanceof XMLDocType){return this.attList.apply(this,arguments);}else{return this.attribute.apply(this,arguments);}};XMLDocumentCB.prototype.ent=function(name,value){return this.entity(name,value);};XMLDocumentCB.prototype.pent=function(name,value){return this.pEntity(name,value);};XMLDocumentCB.prototype.not=function(name,value){return this.notation(name,value);};return XMLDocumentCB;})();}).call(this);},{"./Utility":158,"./XMLAttribute":159,"./XMLCData":160,"./XMLComment":161,"./XMLDTDAttList":162,"./XMLDTDElement":163,"./XMLDTDEntity":164,"./XMLDTDNotation":165,"./XMLDeclaration":166,"./XMLDocType":167,"./XMLElement":170,"./XMLProcessingInstruction":172,"./XMLRaw":173,"./XMLStringWriter":175,"./XMLStringifier":176,"./XMLText":177}],170:[function(require,module,exports){(function(){var XMLAttribute,XMLElement,XMLNode,getValue,isFunction,isObject,ref,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;ref=require('./Utility'),isObject=ref.isObject,isFunction=ref.isFunction,getValue=ref.getValue;XMLNode=require('./XMLNode');XMLAttribute=require('./XMLAttribute');module.exports=XMLElement=(function(superClass){extend(XMLElement,superClass);function XMLElement(parent,name,attributes){XMLElement.__super__.constructor.call(this,parent);if(name==null){throw new Error("Missing element name. "+this.debugInfo());}
this.name=this.stringify.eleName(name);this.attributes={};if(attributes!=null){this.attribute(attributes);}
if(parent.isDocument){this.isRoot=true;this.documentObject=parent;parent.rootObject=this;}}
XMLElement.prototype.clone=function(){var att,attName,clonedSelf,ref1;clonedSelf=Object.create(this);if(clonedSelf.isRoot){clonedSelf.documentObject=null;}
clonedSelf.attributes={};ref1=this.attributes;for(attName in ref1){if(!hasProp.call(ref1,attName))continue;att=ref1[attName];clonedSelf.attributes[attName]=att.clone();}
clonedSelf.children=[];this.children.forEach(function(child){var clonedChild;clonedChild=child.clone();clonedChild.parent=clonedSelf;return clonedSelf.children.push(clonedChild);});return clonedSelf;};XMLElement.prototype.attribute=function(name,value){var attName,attValue;if(name!=null){name=getValue(name);}
if(isObject(name)){for(attName in name){if(!hasProp.call(name,attName))continue;attValue=name[attName];this.attribute(attName,attValue);}}else{if(isFunction(value)){value=value.apply();}
if(!this.options.skipNullAttributes||(value!=null)){this.attributes[name]=new XMLAttribute(this,name,value);}}
return this;};XMLElement.prototype.removeAttribute=function(name){var attName,i,len;if(name==null){throw new Error("Missing attribute name. "+this.debugInfo());}
name=getValue(name);if(Array.isArray(name)){for(i=0,len=name.length;i<len;i++){attName=name[i];delete this.attributes[attName];}}else{delete this.attributes[name];}
return this;};XMLElement.prototype.toString=function(options){return this.options.writer.set(options).element(this);};XMLElement.prototype.att=function(name,value){return this.attribute(name,value);};XMLElement.prototype.a=function(name,value){return this.attribute(name,value);};return XMLElement;})(XMLNode);}).call(this);},{"./Utility":158,"./XMLAttribute":159,"./XMLNode":171}],171:[function(require,module,exports){(function(){var XMLCData,XMLComment,XMLDeclaration,XMLDocType,XMLElement,XMLNode,XMLProcessingInstruction,XMLRaw,XMLText,getValue,isEmpty,isFunction,isObject,ref,hasProp={}.hasOwnProperty;ref=require('./Utility'),isObject=ref.isObject,isFunction=ref.isFunction,isEmpty=ref.isEmpty,getValue=ref.getValue;XMLElement=null;XMLCData=null;XMLComment=null;XMLDeclaration=null;XMLDocType=null;XMLRaw=null;XMLText=null;XMLProcessingInstruction=null;module.exports=XMLNode=(function(){function XMLNode(parent){this.parent=parent;if(this.parent){this.options=this.parent.options;this.stringify=this.parent.stringify;}
this.children=[];if(!XMLElement){XMLElement=require('./XMLElement');XMLCData=require('./XMLCData');XMLComment=require('./XMLComment');XMLDeclaration=require('./XMLDeclaration');XMLDocType=require('./XMLDocType');XMLRaw=require('./XMLRaw');XMLText=require('./XMLText');XMLProcessingInstruction=require('./XMLProcessingInstruction');}}
XMLNode.prototype.element=function(name,attributes,text){var childNode,item,j,k,key,lastChild,len,len1,ref1,val;lastChild=null;if(attributes==null){attributes={};}
attributes=getValue(attributes);if(!isObject(attributes)){ref1=[attributes,text],text=ref1[0],attributes=ref1[1];}
if(name!=null){name=getValue(name);}
if(Array.isArray(name)){for(j=0,len=name.length;j<len;j++){item=name[j];lastChild=this.element(item);}}else if(isFunction(name)){lastChild=this.element(name.apply());}else if(isObject(name)){for(key in name){if(!hasProp.call(name,key))continue;val=name[key];if(isFunction(val)){val=val.apply();}
if((isObject(val))&&(isEmpty(val))){val=null;}
if(!this.options.ignoreDecorators&&this.stringify.convertAttKey&&key.indexOf(this.stringify.convertAttKey)===0){lastChild=this.attribute(key.substr(this.stringify.convertAttKey.length),val);}else if(!this.options.separateArrayItems&&Array.isArray(val)){for(k=0,len1=val.length;k<len1;k++){item=val[k];childNode={};childNode[key]=item;lastChild=this.element(childNode);}}else if(isObject(val)){lastChild=this.element(key);lastChild.element(val);}else{lastChild=this.element(key,val);}}}else{if(!this.options.ignoreDecorators&&this.stringify.convertTextKey&&name.indexOf(this.stringify.convertTextKey)===0){lastChild=this.text(text);}else if(!this.options.ignoreDecorators&&this.stringify.convertCDataKey&&name.indexOf(this.stringify.convertCDataKey)===0){lastChild=this.cdata(text);}else if(!this.options.ignoreDecorators&&this.stringify.convertCommentKey&&name.indexOf(this.stringify.convertCommentKey)===0){lastChild=this.comment(text);}else if(!this.options.ignoreDecorators&&this.stringify.convertRawKey&&name.indexOf(this.stringify.convertRawKey)===0){lastChild=this.raw(text);}else if(!this.options.ignoreDecorators&&this.stringify.convertPIKey&&name.indexOf(this.stringify.convertPIKey)===0){lastChild=this.instruction(name.substr(this.stringify.convertPIKey.length),text);}else{lastChild=this.node(name,attributes,text);}}
if(lastChild==null){throw new Error("Could not create any elements with: "+name+". "+this.debugInfo());}
return lastChild;};XMLNode.prototype.insertBefore=function(name,attributes,text){var child,i,removed;if(this.isRoot){throw new Error("Cannot insert elements at root level. "+this.debugInfo(name));}
i=this.parent.children.indexOf(this);removed=this.parent.children.splice(i);child=this.parent.element(name,attributes,text);Array.prototype.push.apply(this.parent.children,removed);return child;};XMLNode.prototype.insertAfter=function(name,attributes,text){var child,i,removed;if(this.isRoot){throw new Error("Cannot insert elements at root level. "+this.debugInfo(name));}
i=this.parent.children.indexOf(this);removed=this.parent.children.splice(i+1);child=this.parent.element(name,attributes,text);Array.prototype.push.apply(this.parent.children,removed);return child;};XMLNode.prototype.remove=function(){var i,ref1;if(this.isRoot){throw new Error("Cannot remove the root element. "+this.debugInfo());}
i=this.parent.children.indexOf(this);[].splice.apply(this.parent.children,[i,i-i+1].concat(ref1=[])),ref1;return this.parent;};XMLNode.prototype.node=function(name,attributes,text){var child,ref1;if(name!=null){name=getValue(name);}
attributes||(attributes={});attributes=getValue(attributes);if(!isObject(attributes)){ref1=[attributes,text],text=ref1[0],attributes=ref1[1];}
child=new XMLElement(this,name,attributes);if(text!=null){child.text(text);}
this.children.push(child);return child;};XMLNode.prototype.text=function(value){var child;child=new XMLText(this,value);this.children.push(child);return this;};XMLNode.prototype.cdata=function(value){var child;child=new XMLCData(this,value);this.children.push(child);return this;};XMLNode.prototype.comment=function(value){var child;child=new XMLComment(this,value);this.children.push(child);return this;};XMLNode.prototype.commentBefore=function(value){var child,i,removed;i=this.parent.children.indexOf(this);removed=this.parent.children.splice(i);child=this.parent.comment(value);Array.prototype.push.apply(this.parent.children,removed);return this;};XMLNode.prototype.commentAfter=function(value){var child,i,removed;i=this.parent.children.indexOf(this);removed=this.parent.children.splice(i+1);child=this.parent.comment(value);Array.prototype.push.apply(this.parent.children,removed);return this;};XMLNode.prototype.raw=function(value){var child;child=new XMLRaw(this,value);this.children.push(child);return this;};XMLNode.prototype.instruction=function(target,value){var insTarget,insValue,instruction,j,len;if(target!=null){target=getValue(target);}
if(value!=null){value=getValue(value);}
if(Array.isArray(target)){for(j=0,len=target.length;j<len;j++){insTarget=target[j];this.instruction(insTarget);}}else if(isObject(target)){for(insTarget in target){if(!hasProp.call(target,insTarget))continue;insValue=target[insTarget];this.instruction(insTarget,insValue);}}else{if(isFunction(value)){value=value.apply();}
instruction=new XMLProcessingInstruction(this,target,value);this.children.push(instruction);}
return this;};XMLNode.prototype.instructionBefore=function(target,value){var child,i,removed;i=this.parent.children.indexOf(this);removed=this.parent.children.splice(i);child=this.parent.instruction(target,value);Array.prototype.push.apply(this.parent.children,removed);return this;};XMLNode.prototype.instructionAfter=function(target,value){var child,i,removed;i=this.parent.children.indexOf(this);removed=this.parent.children.splice(i+1);child=this.parent.instruction(target,value);Array.prototype.push.apply(this.parent.children,removed);return this;};XMLNode.prototype.declaration=function(version,encoding,standalone){var doc,xmldec;doc=this.document();xmldec=new XMLDeclaration(doc,version,encoding,standalone);if(doc.children[0]instanceof XMLDeclaration){doc.children[0]=xmldec;}else{doc.children.unshift(xmldec);}
return doc.root()||doc;};XMLNode.prototype.doctype=function(pubID,sysID){var child,doc,doctype,i,j,k,len,len1,ref1,ref2;doc=this.document();doctype=new XMLDocType(doc,pubID,sysID);ref1=doc.children;for(i=j=0,len=ref1.length;j<len;i=++j){child=ref1[i];if(child instanceof XMLDocType){doc.children[i]=doctype;return doctype;}}
ref2=doc.children;for(i=k=0,len1=ref2.length;k<len1;i=++k){child=ref2[i];if(child.isRoot){doc.children.splice(i,0,doctype);return doctype;}}
doc.children.push(doctype);return doctype;};XMLNode.prototype.up=function(){if(this.isRoot){throw new Error("The root node has no parent. Use doc() if you need to get the document object.");}
return this.parent;};XMLNode.prototype.root=function(){var node;node=this;while(node){if(node.isDocument){return node.rootObject;}else if(node.isRoot){return node;}else{node=node.parent;}}};XMLNode.prototype.document=function(){var node;node=this;while(node){if(node.isDocument){return node;}else{node=node.parent;}}};XMLNode.prototype.end=function(options){return this.document().end(options);};XMLNode.prototype.prev=function(){var i;i=this.parent.children.indexOf(this);if(i<1){throw new Error("Already at the first node. "+this.debugInfo());}
return this.parent.children[i-1];};XMLNode.prototype.next=function(){var i;i=this.parent.children.indexOf(this);if(i===-1||i===this.parent.children.length-1){throw new Error("Already at the last node. "+this.debugInfo());}
return this.parent.children[i+1];};XMLNode.prototype.importDocument=function(doc){var clonedRoot;clonedRoot=doc.root().clone();clonedRoot.parent=this;clonedRoot.isRoot=false;this.children.push(clonedRoot);return this;};XMLNode.prototype.debugInfo=function(name){var ref1,ref2;name=name||this.name;if((name==null)&&!((ref1=this.parent)!=null?ref1.name:void 0)){return "";}else if(name==null){return "parent: <"+this.parent.name+">";}else if(!((ref2=this.parent)!=null?ref2.name:void 0)){return "node: <"+name+">";}else{return "node: <"+name+">, parent: <"+this.parent.name+">";}};XMLNode.prototype.ele=function(name,attributes,text){return this.element(name,attributes,text);};XMLNode.prototype.nod=function(name,attributes,text){return this.node(name,attributes,text);};XMLNode.prototype.txt=function(value){return this.text(value);};XMLNode.prototype.dat=function(value){return this.cdata(value);};XMLNode.prototype.com=function(value){return this.comment(value);};XMLNode.prototype.ins=function(target,value){return this.instruction(target,value);};XMLNode.prototype.doc=function(){return this.document();};XMLNode.prototype.dec=function(version,encoding,standalone){return this.declaration(version,encoding,standalone);};XMLNode.prototype.dtd=function(pubID,sysID){return this.doctype(pubID,sysID);};XMLNode.prototype.e=function(name,attributes,text){return this.element(name,attributes,text);};XMLNode.prototype.n=function(name,attributes,text){return this.node(name,attributes,text);};XMLNode.prototype.t=function(value){return this.text(value);};XMLNode.prototype.d=function(value){return this.cdata(value);};XMLNode.prototype.c=function(value){return this.comment(value);};XMLNode.prototype.r=function(value){return this.raw(value);};XMLNode.prototype.i=function(target,value){return this.instruction(target,value);};XMLNode.prototype.u=function(){return this.up();};XMLNode.prototype.importXMLBuilder=function(doc){return this.importDocument(doc);};return XMLNode;})();}).call(this);},{"./Utility":158,"./XMLCData":160,"./XMLComment":161,"./XMLDeclaration":166,"./XMLDocType":167,"./XMLElement":170,"./XMLProcessingInstruction":172,"./XMLRaw":173,"./XMLText":177}],172:[function(require,module,exports){(function(){var XMLNode,XMLProcessingInstruction,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLProcessingInstruction=(function(superClass){extend(XMLProcessingInstruction,superClass);function XMLProcessingInstruction(parent,target,value){XMLProcessingInstruction.__super__.constructor.call(this,parent);if(target==null){throw new Error("Missing instruction target. "+this.debugInfo());}
this.target=this.stringify.insTarget(target);if(value){this.value=this.stringify.insValue(value);}}
XMLProcessingInstruction.prototype.clone=function(){return Object.create(this);};XMLProcessingInstruction.prototype.toString=function(options){return this.options.writer.set(options).processingInstruction(this);};return XMLProcessingInstruction;})(XMLNode);}).call(this);},{"./XMLNode":171}],173:[function(require,module,exports){(function(){var XMLNode,XMLRaw,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLRaw=(function(superClass){extend(XMLRaw,superClass);function XMLRaw(parent,text){XMLRaw.__super__.constructor.call(this,parent);if(text==null){throw new Error("Missing raw text. "+this.debugInfo());}
this.value=this.stringify.raw(text);}
XMLRaw.prototype.clone=function(){return Object.create(this);};XMLRaw.prototype.toString=function(options){return this.options.writer.set(options).raw(this);};return XMLRaw;})(XMLNode);}).call(this);},{"./XMLNode":171}],174:[function(require,module,exports){(function(){var XMLCData,XMLComment,XMLDTDAttList,XMLDTDElement,XMLDTDEntity,XMLDTDNotation,XMLDeclaration,XMLDocType,XMLElement,XMLProcessingInstruction,XMLRaw,XMLStreamWriter,XMLText,XMLWriterBase,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLDeclaration=require('./XMLDeclaration');XMLDocType=require('./XMLDocType');XMLCData=require('./XMLCData');XMLComment=require('./XMLComment');XMLElement=require('./XMLElement');XMLRaw=require('./XMLRaw');XMLText=require('./XMLText');XMLProcessingInstruction=require('./XMLProcessingInstruction');XMLDTDAttList=require('./XMLDTDAttList');XMLDTDElement=require('./XMLDTDElement');XMLDTDEntity=require('./XMLDTDEntity');XMLDTDNotation=require('./XMLDTDNotation');XMLWriterBase=require('./XMLWriterBase');module.exports=XMLStreamWriter=(function(superClass){extend(XMLStreamWriter,superClass);function XMLStreamWriter(stream,options){XMLStreamWriter.__super__.constructor.call(this,options);this.stream=stream;}
XMLStreamWriter.prototype.document=function(doc){var child,i,j,len,len1,ref,ref1,results;ref=doc.children;for(i=0,len=ref.length;i<len;i++){child=ref[i];child.isLastRootNode=false;}
doc.children[doc.children.length-1].isLastRootNode=true;ref1=doc.children;results=[];for(j=0,len1=ref1.length;j<len1;j++){child=ref1[j];switch(false){case!(child instanceof XMLDeclaration):results.push(this.declaration(child));break;case!(child instanceof XMLDocType):results.push(this.docType(child));break;case!(child instanceof XMLComment):results.push(this.comment(child));break;case!(child instanceof XMLProcessingInstruction):results.push(this.processingInstruction(child));break;default:results.push(this.element(child));}}
return results;};XMLStreamWriter.prototype.attribute=function(att){return this.stream.write(' '+att.name+'="'+att.value+'"');};XMLStreamWriter.prototype.cdata=function(node,level){return this.stream.write(this.space(level)+'<![CDATA['+node.text+']]>'+this.endline(node));};XMLStreamWriter.prototype.comment=function(node,level){return this.stream.write(this.space(level)+'<!-- '+node.text+' -->'+this.endline(node));};XMLStreamWriter.prototype.declaration=function(node,level){this.stream.write(this.space(level));this.stream.write('<?xml version="'+node.version+'"');if(node.encoding!=null){this.stream.write(' encoding="'+node.encoding+'"');}
if(node.standalone!=null){this.stream.write(' standalone="'+node.standalone+'"');}
this.stream.write(this.spacebeforeslash+'?>');return this.stream.write(this.endline(node));};XMLStreamWriter.prototype.docType=function(node,level){var child,i,len,ref;level||(level=0);this.stream.write(this.space(level));this.stream.write('<!DOCTYPE '+node.root().name);if(node.pubID&&node.sysID){this.stream.write(' PUBLIC "'+node.pubID+'" "'+node.sysID+'"');}else if(node.sysID){this.stream.write(' SYSTEM "'+node.sysID+'"');}
if(node.children.length>0){this.stream.write(' [');this.stream.write(this.endline(node));ref=node.children;for(i=0,len=ref.length;i<len;i++){child=ref[i];switch(false){case!(child instanceof XMLDTDAttList):this.dtdAttList(child,level+1);break;case!(child instanceof XMLDTDElement):this.dtdElement(child,level+1);break;case!(child instanceof XMLDTDEntity):this.dtdEntity(child,level+1);break;case!(child instanceof XMLDTDNotation):this.dtdNotation(child,level+1);break;case!(child instanceof XMLCData):this.cdata(child,level+1);break;case!(child instanceof XMLComment):this.comment(child,level+1);break;case!(child instanceof XMLProcessingInstruction):this.processingInstruction(child,level+1);break;default:throw new Error("Unknown DTD node type: "+child.constructor.name);}}
this.stream.write(']');}
this.stream.write(this.spacebeforeslash+'>');return this.stream.write(this.endline(node));};XMLStreamWriter.prototype.element=function(node,level){var att,child,i,len,name,ref,ref1,space;level||(level=0);space=this.space(level);this.stream.write(space+'<'+node.name);ref=node.attributes;for(name in ref){if(!hasProp.call(ref,name))continue;att=ref[name];this.attribute(att);}
if(node.children.length===0||node.children.every(function(e){return e.value==='';})){if(this.allowEmpty){this.stream.write('></'+node.name+'>');}else{this.stream.write(this.spacebeforeslash+'/>');}}else if(this.pretty&&node.children.length===1&&(node.children[0].value!=null)){this.stream.write('>');this.stream.write(node.children[0].value);this.stream.write('</'+node.name+'>');}else{this.stream.write('>'+this.newline);ref1=node.children;for(i=0,len=ref1.length;i<len;i++){child=ref1[i];switch(false){case!(child instanceof XMLCData):this.cdata(child,level+1);break;case!(child instanceof XMLComment):this.comment(child,level+1);break;case!(child instanceof XMLElement):this.element(child,level+1);break;case!(child instanceof XMLRaw):this.raw(child,level+1);break;case!(child instanceof XMLText):this.text(child,level+1);break;case!(child instanceof XMLProcessingInstruction):this.processingInstruction(child,level+1);break;default:throw new Error("Unknown XML node type: "+child.constructor.name);}}
this.stream.write(space+'</'+node.name+'>');}
return this.stream.write(this.endline(node));};XMLStreamWriter.prototype.processingInstruction=function(node,level){this.stream.write(this.space(level)+'<?'+node.target);if(node.value){this.stream.write(' '+node.value);}
return this.stream.write(this.spacebeforeslash+'?>'+this.endline(node));};XMLStreamWriter.prototype.raw=function(node,level){return this.stream.write(this.space(level)+node.value+this.endline(node));};XMLStreamWriter.prototype.text=function(node,level){return this.stream.write(this.space(level)+node.value+this.endline(node));};XMLStreamWriter.prototype.dtdAttList=function(node,level){this.stream.write(this.space(level)+'<!ATTLIST '+node.elementName+' '+node.attributeName+' '+node.attributeType);if(node.defaultValueType!=='#DEFAULT'){this.stream.write(' '+node.defaultValueType);}
if(node.defaultValue){this.stream.write(' "'+node.defaultValue+'"');}
return this.stream.write(this.spacebeforeslash+'>'+this.endline(node));};XMLStreamWriter.prototype.dtdElement=function(node,level){this.stream.write(this.space(level)+'<!ELEMENT '+node.name+' '+node.value);return this.stream.write(this.spacebeforeslash+'>'+this.endline(node));};XMLStreamWriter.prototype.dtdEntity=function(node,level){this.stream.write(this.space(level)+'<!ENTITY');if(node.pe){this.stream.write(' %');}
this.stream.write(' '+node.name);if(node.value){this.stream.write(' "'+node.value+'"');}else{if(node.pubID&&node.sysID){this.stream.write(' PUBLIC "'+node.pubID+'" "'+node.sysID+'"');}else if(node.sysID){this.stream.write(' SYSTEM "'+node.sysID+'"');}
if(node.nData){this.stream.write(' NDATA '+node.nData);}}
return this.stream.write(this.spacebeforeslash+'>'+this.endline(node));};XMLStreamWriter.prototype.dtdNotation=function(node,level){this.stream.write(this.space(level)+'<!NOTATION '+node.name);if(node.pubID&&node.sysID){this.stream.write(' PUBLIC "'+node.pubID+'" "'+node.sysID+'"');}else if(node.pubID){this.stream.write(' PUBLIC "'+node.pubID+'"');}else if(node.sysID){this.stream.write(' SYSTEM "'+node.sysID+'"');}
return this.stream.write(this.spacebeforeslash+'>'+this.endline(node));};XMLStreamWriter.prototype.endline=function(node){if(!node.isLastRootNode){return this.newline;}else{return '';}};return XMLStreamWriter;})(XMLWriterBase);}).call(this);},{"./XMLCData":160,"./XMLComment":161,"./XMLDTDAttList":162,"./XMLDTDElement":163,"./XMLDTDEntity":164,"./XMLDTDNotation":165,"./XMLDeclaration":166,"./XMLDocType":167,"./XMLElement":170,"./XMLProcessingInstruction":172,"./XMLRaw":173,"./XMLText":177,"./XMLWriterBase":178}],175:[function(require,module,exports){(function(){var XMLCData,XMLComment,XMLDTDAttList,XMLDTDElement,XMLDTDEntity,XMLDTDNotation,XMLDeclaration,XMLDocType,XMLElement,XMLProcessingInstruction,XMLRaw,XMLStringWriter,XMLText,XMLWriterBase,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLDeclaration=require('./XMLDeclaration');XMLDocType=require('./XMLDocType');XMLCData=require('./XMLCData');XMLComment=require('./XMLComment');XMLElement=require('./XMLElement');XMLRaw=require('./XMLRaw');XMLText=require('./XMLText');XMLProcessingInstruction=require('./XMLProcessingInstruction');XMLDTDAttList=require('./XMLDTDAttList');XMLDTDElement=require('./XMLDTDElement');XMLDTDEntity=require('./XMLDTDEntity');XMLDTDNotation=require('./XMLDTDNotation');XMLWriterBase=require('./XMLWriterBase');module.exports=XMLStringWriter=(function(superClass){extend(XMLStringWriter,superClass);function XMLStringWriter(options){XMLStringWriter.__super__.constructor.call(this,options);}
XMLStringWriter.prototype.document=function(doc){var child,i,len,r,ref;this.textispresent=false;r='';ref=doc.children;for(i=0,len=ref.length;i<len;i++){child=ref[i];r+=(function(){switch(false){case!(child instanceof XMLDeclaration):return this.declaration(child);case!(child instanceof XMLDocType):return this.docType(child);case!(child instanceof XMLComment):return this.comment(child);case!(child instanceof XMLProcessingInstruction):return this.processingInstruction(child);default:return this.element(child,0);}}).call(this);}
if(this.pretty&&r.slice(-this.newline.length)===this.newline){r=r.slice(0,-this.newline.length);}
return r;};XMLStringWriter.prototype.attribute=function(att){return ' '+att.name+'="'+att.value+'"';};XMLStringWriter.prototype.cdata=function(node,level){return this.space(level)+'<![CDATA['+node.text+']]>'+this.newline;};XMLStringWriter.prototype.comment=function(node,level){return this.space(level)+'<!-- '+node.text+' -->'+this.newline;};XMLStringWriter.prototype.declaration=function(node,level){var r;r=this.space(level);r+='<?xml version="'+node.version+'"';if(node.encoding!=null){r+=' encoding="'+node.encoding+'"';}
if(node.standalone!=null){r+=' standalone="'+node.standalone+'"';}
r+=this.spacebeforeslash+'?>';r+=this.newline;return r;};XMLStringWriter.prototype.docType=function(node,level){var child,i,len,r,ref;level||(level=0);r=this.space(level);r+='<!DOCTYPE '+node.root().name;if(node.pubID&&node.sysID){r+=' PUBLIC "'+node.pubID+'" "'+node.sysID+'"';}else if(node.sysID){r+=' SYSTEM "'+node.sysID+'"';}
if(node.children.length>0){r+=' [';r+=this.newline;ref=node.children;for(i=0,len=ref.length;i<len;i++){child=ref[i];r+=(function(){switch(false){case!(child instanceof XMLDTDAttList):return this.dtdAttList(child,level+1);case!(child instanceof XMLDTDElement):return this.dtdElement(child,level+1);case!(child instanceof XMLDTDEntity):return this.dtdEntity(child,level+1);case!(child instanceof XMLDTDNotation):return this.dtdNotation(child,level+1);case!(child instanceof XMLCData):return this.cdata(child,level+1);case!(child instanceof XMLComment):return this.comment(child,level+1);case!(child instanceof XMLProcessingInstruction):return this.processingInstruction(child,level+1);default:throw new Error("Unknown DTD node type: "+child.constructor.name);}}).call(this);}
r+=']';}
r+=this.spacebeforeslash+'>';r+=this.newline;return r;};XMLStringWriter.prototype.element=function(node,level){var att,child,i,j,len,len1,name,r,ref,ref1,ref2,space,textispresentwasset;level||(level=0);textispresentwasset=false;if(this.textispresent){this.newline='';this.pretty=false;}else{this.newline=this.newlinedefault;this.pretty=this.prettydefault;}
space=this.space(level);r='';r+=space+'<'+node.name;ref=node.attributes;for(name in ref){if(!hasProp.call(ref,name))continue;att=ref[name];r+=this.attribute(att);}
if(node.children.length===0||node.children.every(function(e){return e.value==='';})){if(this.allowEmpty){r+='></'+node.name+'>'+this.newline;}else{r+=this.spacebeforeslash+'/>'+this.newline;}}else if(this.pretty&&node.children.length===1&&(node.children[0].value!=null)){r+='>';r+=node.children[0].value;r+='</'+node.name+'>'+this.newline;}else{if(this.dontprettytextnodes){ref1=node.children;for(i=0,len=ref1.length;i<len;i++){child=ref1[i];if(child.value!=null){this.textispresent++;textispresentwasset=true;break;}}}
if(this.textispresent){this.newline='';this.pretty=false;space=this.space(level);}
r+='>'+this.newline;ref2=node.children;for(j=0,len1=ref2.length;j<len1;j++){child=ref2[j];r+=(function(){switch(false){case!(child instanceof XMLCData):return this.cdata(child,level+1);case!(child instanceof XMLComment):return this.comment(child,level+1);case!(child instanceof XMLElement):return this.element(child,level+1);case!(child instanceof XMLRaw):return this.raw(child,level+1);case!(child instanceof XMLText):return this.text(child,level+1);case!(child instanceof XMLProcessingInstruction):return this.processingInstruction(child,level+1);default:throw new Error("Unknown XML node type: "+child.constructor.name);}}).call(this);}
if(textispresentwasset){this.textispresent--;}
if(!this.textispresent){this.newline=this.newlinedefault;this.pretty=this.prettydefault;}
r+=space+'</'+node.name+'>'+this.newline;}
return r;};XMLStringWriter.prototype.processingInstruction=function(node,level){var r;r=this.space(level)+'<?'+node.target;if(node.value){r+=' '+node.value;}
r+=this.spacebeforeslash+'?>'+this.newline;return r;};XMLStringWriter.prototype.raw=function(node,level){return this.space(level)+node.value+this.newline;};XMLStringWriter.prototype.text=function(node,level){return this.space(level)+node.value+this.newline;};XMLStringWriter.prototype.dtdAttList=function(node,level){var r;r=this.space(level)+'<!ATTLIST '+node.elementName+' '+node.attributeName+' '+node.attributeType;if(node.defaultValueType!=='#DEFAULT'){r+=' '+node.defaultValueType;}
if(node.defaultValue){r+=' "'+node.defaultValue+'"';}
r+=this.spacebeforeslash+'>'+this.newline;return r;};XMLStringWriter.prototype.dtdElement=function(node,level){return this.space(level)+'<!ELEMENT '+node.name+' '+node.value+this.spacebeforeslash+'>'+this.newline;};XMLStringWriter.prototype.dtdEntity=function(node,level){var r;r=this.space(level)+'<!ENTITY';if(node.pe){r+=' %';}
r+=' '+node.name;if(node.value){r+=' "'+node.value+'"';}else{if(node.pubID&&node.sysID){r+=' PUBLIC "'+node.pubID+'" "'+node.sysID+'"';}else if(node.sysID){r+=' SYSTEM "'+node.sysID+'"';}
if(node.nData){r+=' NDATA '+node.nData;}}
r+=this.spacebeforeslash+'>'+this.newline;return r;};XMLStringWriter.prototype.dtdNotation=function(node,level){var r;r=this.space(level)+'<!NOTATION '+node.name;if(node.pubID&&node.sysID){r+=' PUBLIC "'+node.pubID+'" "'+node.sysID+'"';}else if(node.pubID){r+=' PUBLIC "'+node.pubID+'"';}else if(node.sysID){r+=' SYSTEM "'+node.sysID+'"';}
r+=this.spacebeforeslash+'>'+this.newline;return r;};XMLStringWriter.prototype.openNode=function(node,level){var att,name,r,ref;level||(level=0);if(node instanceof XMLElement){r=this.space(level)+'<'+node.name;ref=node.attributes;for(name in ref){if(!hasProp.call(ref,name))continue;att=ref[name];r+=this.attribute(att);}
r+=(node.children?'>':'/>')+this.newline;return r;}else{r=this.space(level)+'<!DOCTYPE '+node.rootNodeName;if(node.pubID&&node.sysID){r+=' PUBLIC "'+node.pubID+'" "'+node.sysID+'"';}else if(node.sysID){r+=' SYSTEM "'+node.sysID+'"';}
r+=(node.children?' [':'>')+this.newline;return r;}};XMLStringWriter.prototype.closeNode=function(node,level){level||(level=0);switch(false){case!(node instanceof XMLElement):return this.space(level)+'</'+node.name+'>'+this.newline;case!(node instanceof XMLDocType):return this.space(level)+']>'+this.newline;}};return XMLStringWriter;})(XMLWriterBase);}).call(this);},{"./XMLCData":160,"./XMLComment":161,"./XMLDTDAttList":162,"./XMLDTDElement":163,"./XMLDTDEntity":164,"./XMLDTDNotation":165,"./XMLDeclaration":166,"./XMLDocType":167,"./XMLElement":170,"./XMLProcessingInstruction":172,"./XMLRaw":173,"./XMLText":177,"./XMLWriterBase":178}],176:[function(require,module,exports){(function(){var XMLStringifier,bind=function(fn,me){return function(){return fn.apply(me,arguments);};},hasProp={}.hasOwnProperty;module.exports=XMLStringifier=(function(){function XMLStringifier(options){this.assertLegalChar=bind(this.assertLegalChar,this);var key,ref,value;options||(options={});this.noDoubleEncoding=options.noDoubleEncoding;ref=options.stringify||{};for(key in ref){if(!hasProp.call(ref,key))continue;value=ref[key];this[key]=value;}}
XMLStringifier.prototype.eleName=function(val){val=''+val||'';return this.assertLegalChar(val);};XMLStringifier.prototype.eleText=function(val){val=''+val||'';return this.assertLegalChar(this.elEscape(val));};XMLStringifier.prototype.cdata=function(val){val=''+val||'';val=val.replace(']]>',']]]]><![CDATA[>');return this.assertLegalChar(val);};XMLStringifier.prototype.comment=function(val){val=''+val||'';if(val.match(/--/)){throw new Error("Comment text cannot contain double-hypen: "+val);}
return this.assertLegalChar(val);};XMLStringifier.prototype.raw=function(val){return ''+val||'';};XMLStringifier.prototype.attName=function(val){return val=''+val||'';};XMLStringifier.prototype.attValue=function(val){val=''+val||'';return this.attEscape(val);};XMLStringifier.prototype.insTarget=function(val){return ''+val||'';};XMLStringifier.prototype.insValue=function(val){val=''+val||'';if(val.match(/\?>/)){throw new Error("Invalid processing instruction value: "+val);}
return val;};XMLStringifier.prototype.xmlVersion=function(val){val=''+val||'';if(!val.match(/1\.[0-9]+/)){throw new Error("Invalid version number: "+val);}
return val;};XMLStringifier.prototype.xmlEncoding=function(val){val=''+val||'';if(!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)){throw new Error("Invalid encoding: "+val);}
return val;};XMLStringifier.prototype.xmlStandalone=function(val){if(val){return "yes";}else{return "no";}};XMLStringifier.prototype.dtdPubID=function(val){return ''+val||'';};XMLStringifier.prototype.dtdSysID=function(val){return ''+val||'';};XMLStringifier.prototype.dtdElementValue=function(val){return ''+val||'';};XMLStringifier.prototype.dtdAttType=function(val){return ''+val||'';};XMLStringifier.prototype.dtdAttDefault=function(val){if(val!=null){return ''+val||'';}else{return val;}};XMLStringifier.prototype.dtdEntityValue=function(val){return ''+val||'';};XMLStringifier.prototype.dtdNData=function(val){return ''+val||'';};XMLStringifier.prototype.convertAttKey='@';XMLStringifier.prototype.convertPIKey='?';XMLStringifier.prototype.convertTextKey='#text';XMLStringifier.prototype.convertCDataKey='#cdata';XMLStringifier.prototype.convertCommentKey='#comment';XMLStringifier.prototype.convertRawKey='#raw';XMLStringifier.prototype.assertLegalChar=function(str){var res;res=str.match(/[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/);if(res){throw new Error("Invalid character in string: "+str+" at index "+res.index);}
return str;};XMLStringifier.prototype.elEscape=function(str){var ampregex;ampregex=this.noDoubleEncoding?/(?!&\S+;)&/g:/&/g;return str.replace(ampregex,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r/g,'&#xD;');};XMLStringifier.prototype.attEscape=function(str){var ampregex;ampregex=this.noDoubleEncoding?/(?!&\S+;)&/g:/&/g;return str.replace(ampregex,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/\t/g,'&#x9;').replace(/\n/g,'&#xA;').replace(/\r/g,'&#xD;');};return XMLStringifier;})();}).call(this);},{}],177:[function(require,module,exports){(function(){var XMLNode,XMLText,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key];}function ctor(){this.constructor=child;}ctor.prototype=parent.prototype;child.prototype=new ctor();child.__super__=parent.prototype;return child;},hasProp={}.hasOwnProperty;XMLNode=require('./XMLNode');module.exports=XMLText=(function(superClass){extend(XMLText,superClass);function XMLText(parent,text){XMLText.__super__.constructor.call(this,parent);if(text==null){throw new Error("Missing element text. "+this.debugInfo());}
this.value=this.stringify.eleText(text);}
XMLText.prototype.clone=function(){return Object.create(this);};XMLText.prototype.toString=function(options){return this.options.writer.set(options).text(this);};return XMLText;})(XMLNode);}).call(this);},{"./XMLNode":171}],178:[function(require,module,exports){(function(){var XMLWriterBase,hasProp={}.hasOwnProperty;module.exports=XMLWriterBase=(function(){function XMLWriterBase(options){var key,ref,ref1,ref2,ref3,ref4,ref5,ref6,value;options||(options={});this.pretty=options.pretty||false;this.allowEmpty=(ref=options.allowEmpty)!=null?ref:false;if(this.pretty){this.indent=(ref1=options.indent)!=null?ref1:'  ';this.newline=(ref2=options.newline)!=null?ref2:'\n';this.offset=(ref3=options.offset)!=null?ref3:0;this.dontprettytextnodes=(ref4=options.dontprettytextnodes)!=null?ref4:0;}else{this.indent='';this.newline='';this.offset=0;this.dontprettytextnodes=0;}
this.spacebeforeslash=(ref5=options.spacebeforeslash)!=null?ref5:'';if(this.spacebeforeslash===true){this.spacebeforeslash=' ';}
this.newlinedefault=this.newline;this.prettydefault=this.pretty;ref6=options.writer||{};for(key in ref6){if(!hasProp.call(ref6,key))continue;value=ref6[key];this[key]=value;}}
XMLWriterBase.prototype.set=function(options){var key,ref,value;options||(options={});if("pretty"in options){this.pretty=options.pretty;}
if("allowEmpty"in options){this.allowEmpty=options.allowEmpty;}
if(this.pretty){this.indent="indent"in options?options.indent:'  ';this.newline="newline"in options?options.newline:'\n';this.offset="offset"in options?options.offset:0;this.dontprettytextnodes="dontprettytextnodes"in options?options.dontprettytextnodes:0;}else{this.indent='';this.newline='';this.offset=0;this.dontprettytextnodes=0;}
this.spacebeforeslash="spacebeforeslash"in options?options.spacebeforeslash:'';if(this.spacebeforeslash===true){this.spacebeforeslash=' ';}
this.newlinedefault=this.newline;this.prettydefault=this.pretty;ref=options.writer||{};for(key in ref){if(!hasProp.call(ref,key))continue;value=ref[key];this[key]=value;}
return this;};XMLWriterBase.prototype.space=function(level){var indent;if(this.pretty){indent=(level||0)+this.offset+1;if(indent>0){return new Array(indent).join(this.indent);}else{return '';}}else{return '';}};return XMLWriterBase;})();}).call(this);},{}],179:[function(require,module,exports){(function(){var XMLDocument,XMLDocumentCB,XMLStreamWriter,XMLStringWriter,assign,isFunction,ref;ref=require('./Utility'),assign=ref.assign,isFunction=ref.isFunction;XMLDocument=require('./XMLDocument');XMLDocumentCB=require('./XMLDocumentCB');XMLStringWriter=require('./XMLStringWriter');XMLStreamWriter=require('./XMLStreamWriter');module.exports.create=function(name,xmldec,doctype,options){var doc,root;if(name==null){throw new Error("Root element needs a name.");}
options=assign({},xmldec,doctype,options);doc=new XMLDocument(options);root=doc.element(name);if(!options.headless){doc.declaration(options);if((options.pubID!=null)||(options.sysID!=null)){doc.doctype(options);}}
return root;};module.exports.begin=function(options,onData,onEnd){var ref1;if(isFunction(options)){ref1=[options,onData],onData=ref1[0],onEnd=ref1[1];options={};}
if(onData){return new XMLDocumentCB(options,onData,onEnd);}else{return new XMLDocument(options);}};module.exports.stringWriter=function(options){return new XMLStringWriter(options);};module.exports.streamWriter=function(stream,options){return new XMLStreamWriter(stream,options);};}).call(this);},{"./Utility":158,"./XMLDocument":168,"./XMLDocumentCB":169,"./XMLStreamWriter":174,"./XMLStringWriter":175}]},{},[21])(21)});