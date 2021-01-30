import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocialNetworkShareService {

  shareFacebook(shareUrl = environment.baseUrl) {
    const url = 'https://www.facebook.com/dialog/share?app_id=' + environment.facebookAppId + '&href=' + shareUrl;
    window.open(url, 'name', 'height=500,width=520,top=200,left=300,resizable');
  }

  shareTwitter(shareUrl = environment.baseUrl, msg = '') {
     let twitterShareUrl = 'http://twitter.com/share?';

     const params: any = {
       url: shareUrl,
       text: msg,
       hashtags: 'covid19,corona,koronahra',
     };

     for (const prop in params) twitterShareUrl += '&' + prop + '=' + encodeURIComponent(params[prop]);
     window.open(twitterShareUrl, '', 'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
  }

  shareLinkedIn(shareUrl = environment.baseUrl) {
    const url = `https://www.linkedin.com/shareArticle/?url=${shareUrl}`;

    window.open(url, 'name', 'height=500,width=520,top=200,left=300,resizable');
  }
}
