export class Helpers {
  static firstletterUppercase(str: string): string {
    const valueString = str.toLowerCase();
    return valueString
      .split(' ')
      .map((value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`)
      .join(' ');
  }

  static lowerCase(str: string): string {
    return str.toLowerCase();
  }

  static generateRandomIntegers(integerLength: number): number {
    const characters = '0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < integerLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return parseInt(result, 10);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parseJson(prop: string): any {
    try {
      // JSON 문자열 파싱
      return JSON.parse(prop);
    } catch (error) {
      // 날짜 문자열인지 확인하고 변환
      if (/^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4}/.test(prop)) {
        console.log('날짜 문자열로 감지됨:', prop);
        return new Date(prop);
      }

      // 파싱 오류 시 원본 데이터 반환
      console.log('JSON 파싱 중 에러 발생:', error);
      console.log('파싱 시도한 데이터:', prop);
      return prop;
    }
  }
}
