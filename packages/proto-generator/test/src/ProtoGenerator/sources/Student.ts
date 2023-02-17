import NSPerson from './NSPerson';

export default interface Student {
    name: string,
    age: number,
    class: string[]
    sex: NSPerson.Person['sex'];
}

export interface Unused1 {
    value: string
}

interface Unused2 {
    value: string
}