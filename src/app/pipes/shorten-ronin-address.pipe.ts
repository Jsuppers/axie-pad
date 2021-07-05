import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenRoninAddress'
})
export class ShortenRoninAddressPipe implements PipeTransform {
  transform(value: string, hideAddress: boolean): string {
    if (!value) {
      return '...';
    }
    return hideAddress ? '*'.repeat(10) : value.substring(0, 10) + '...' + value.substring(value.length - 5, value.length);
  }

}
