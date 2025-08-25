// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  rollno: string;
  stop: string;
  route: string;
  fare: number;
  paymentStatus: boolean;
  lastPaymentDate: string | null;
  role: 'student' | 'admin';
  photo:string;
  busname:string;
}