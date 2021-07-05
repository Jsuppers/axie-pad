import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenName'
})
export class ShortenNamePipe implements PipeTransform {

  transform(value: string, hideAddress: boolean): string {
    if (!value) {
      return value;
    }
    let shortenedName = value;
    if (shortenedName.length > 20) {
      shortenedName = shortenedName.substring(0, 19) + '...';
    }
    return hideAddress ? '*'.repeat(10) : shortenedName;
  }

}
