declare module 'ringcentral' {
  export default class RingCentral {
    constructor(options: any);
    platform(): any;
  }
}

declare module 'ringcentral-web-phone' {
  export default class WebPhone {
    constructor(clientInfo: any, options: any);
    userAgent: any;
  }
}
