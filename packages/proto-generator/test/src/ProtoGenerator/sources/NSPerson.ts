import Animal from './Animal';

namespace NSPerson {
  export interface Male extends Animal {
    maleXXX: {
      value: string;
    };

    sex: 'm';
  }

  export interface Female extends Animal {
    femaleXXX: {
      value: string;
    };

    sex: 'f';
  }

  export type Person = Male | Female;
}
export default NSPerson;

export interface Unused1 {
  value: string;
}

interface Unused2 {
  value: string;
}
