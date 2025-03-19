/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const unzip = (arrayBuffer: ArrayBuffer) => {
    return new Promise((resolve, reject) => {
        if ( !(arrayBuffer instanceof ArrayBuffer) ) {
            reject('"arrayBuffer" param is not an instance of `ArrayBuffer`')
            return
        }
        const worker = new Worker(URL.createObjectURL(new Blob(['"use strict";function decodeUTF8(a){return new TextEncoder().encode(a)}function UntarWorker(){return{onmessage(a){try{if("extract"===a.data.type)this.untarBuffer(a.data.buffer);else throw new Error("Unknown message type: "+a.data.type)}catch(a){this.postError(a)}},postError(a){this.postMessage({type:"error",data:{message:a.message}})},untarBuffer(a){try{for(var b=new UntarFileStream(a);b.hasNext();){let a=b.next();this.postMessage({type:"extract",data:a},[a.buffer])}this.postMessage({type:"complete"})}catch(a){this.postError(a)}},postMessage(a,b){self.postMessage(a,b)}}}function PaxHeader(a){let b=this;return this._fields=a,{applyHeader(a){b._fields.forEach(b=>{let c=b.name,d=b.value;"path"===c?(c="name",void 0!==a.prefix&&delete a.prefix):"linkpath"==c&&(c="linkname"),null===d?delete a[c]:a[c]=d})},parse(a){let b=new Uint8Array(a),c=[];for(;0<b.length;){let a=parseInt(decodeUTF8(b.subarray(0,b.indexOf(32)))),d=decodeUTF8(b.subarray(0,a)),e=d.match(/^\\d+ ([^=]+)=(.*)\\n$/);if(null===e)throw new Error("Invalid PAX header data format.");let f=e[1],g=e[2];0===g.length?g=null:null!==g.match(/^\\d+$/)&&(g=parseInt(g));let h={name:f,value:g};c.push(h),b=b.subarray(a)}return new PaxHeader(c)}}}function TarFile(){}function UntarStream(a){let b=this;return this._bufferView=new DataView(a),this._position=0,{readString(a){let c=[];for(let d,e=0;e<a&&(d=b._bufferView.getUint8(this.position()+e*1,!0),0!==d);++e)c.push(d);return this.seek(1*a),String.fromCharCode.apply(null,c)},readBuffer(a){let c;if("function"==typeof ArrayBuffer.prototype.slice)c=b._bufferView.buffer.slice(this.position(),this.position()+a);else{c=new ArrayBuffer(a);let d=new Uint8Array(c),e=new Uint8Array(b._bufferView.buffer,this.position(),a);d.set(e)}return this.seek(a),c},seek(a){b._position+=a},peekUint32(){return b._bufferView.getUint32(this.position(),!0)},position(a){return void 0===a?b._position:void(b._position=a)},size(){return b._bufferView.byteLength}}}function UntarFileStream(a){let b=this;return this._stream=new UntarStream(a),this._globalPaxHeader=null,{hasNext(){return b._stream.position()+4<b._stream.size()&&0!==b._stream.peekUint32()},next(){return this._readNextFile()},_readNextFile(){let a=b._stream,c=new TarFile,d=!1,e=null,f=a.position(),g=f+512;switch(c.name=a.readString(100),c.mode=a.readString(8),c.uid=parseInt(a.readString(8)),c.gid=parseInt(a.readString(8)),c.size=parseInt(a.readString(12),8),c.mtime=parseInt(a.readString(12),8),c.checksum=parseInt(a.readString(8)),c.type=a.readString(1),c.linkname=a.readString(100),c.ustarFormat=a.readString(6),-1<c.ustarFormat.indexOf("ustar")&&(c.version=a.readString(2),c.uname=a.readString(32),c.gname=a.readString(32),c.devmajor=parseInt(a.readString(8)),c.devminor=parseInt(a.readString(8)),c.namePrefix=a.readString(155),0<c.namePrefix.length&&(c.name=c.namePrefix+"/"+c.name)),a.position(g),c.type){case"0":case"":c.buffer=a.readBuffer(c.size);break;case"1":case"2":case"3":case"4":case"5":case"6":case"7":break;case"g":d=!0,b._globalPaxHeader=PaxHeader.parse(a.readBuffer(c.size));break;case"x":d=!0,e=PaxHeader.parse(a.readBuffer(c.size));break;default:}void 0===c.buffer&&(c.buffer=new ArrayBuffer(0));let h=g+c.size;return 0!=c.size%512&&(h+=512-c.size%512),a.position(h),d&&(c=this._readNextFile()),null!==b._globalPaxHeader&&b._globalPaxHeader.applyHeader(c),null!==e&&e.applyHeader(c),c}}}let worker=new UntarWorker;self.onmessage=a=>{worker.onmessage(a)};']))),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            files: any = []
        worker.onerror = (err) => {
            reject(err)
        }
        worker.onmessage = (message) => {
            message = message.data
            switch (message.type) {
                case "extract":
                    files.push(message.data)
                    break;
                case "complete":
                    worker.terminate()
                    resolve(files)
                    break;
                case "error":
                    worker.terminate()
                    reject(message.data.message)
                    break;
                default:
                    worker.terminate()
                    reject("Unknown message from worker: " + message.type)
                    break;
            }
        }
        worker.postMessage({ type: "extract", buffer: arrayBuffer }, [arrayBuffer])
    })
}
