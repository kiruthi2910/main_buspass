// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

export class FareCalculator {
  private static fareMap: Record<string, number> = {
    'Teppakulam': 41250,
    'Goripalayam': 36135,
    'Anna Nagar': 21450,
    'Vadamalayan': 41250,
    'Thirunagar': 28875,
    'Andalpuram': 28875,
    'KK Nagar': 41250,
    'Madura College': 33000,
    'Crime Branch': 33000,
    'Moondrumavadi': 41250,
    'K.Pudur': 41250,
    'Outpost': 41250,
    'Fathima College': 41250,
    'Kudal Nagar': 41250,
    'Tallakulam': 41250,
    'Periyar': 33000,
    'South Gate': 36135,
    'Kalavasal': 36135,
    'Doak Nagar': 41250,
    'Maatuthavani': 41250

    
  };

  static calculateFare(route: string): number {
    return this.fareMap[route.toLowerCase()] || 2000;
  }

  static getAllRoutes(): string[] {
    return Object.keys(this.fareMap);
  }

  static getRouteOptions(): Array<{ value: string; label: string; fare: number }> {
    return [
      { value: 'Teppakulam', label: 'Teppakulam Route', fare: 41250 },
      { value: 'Goripalayam', label: 'Goripalayam Route', fare: 36135 },
      { value: 'Anna Nagar', label: 'Anna Route', fare: 41250 },
       { value: 'Vadamalayan', label: 'Vadamalayan Route', fare: 41250 },
        { value: 'Thirunagar', label: 'Thirunagar Route', fare: 28875 },
      { value: 'Andalpuram', label: 'Andalpuram Route', fare: 28875 },
      { value: 'KK Nagar', label: 'KK Nagar Route', fare: 41250 },
      { value: 'Madura College', label: 'Madura Route', fare: 33000 },
      { value: 'Crime Branch', label: 'Crime Branch Route', fare: 33000 },
      { value: 'Moondrumavadi', label: 'Moondrumavadi Route', fare: 41250 },
      { value: 'K.Pudur', label: 'pudur Route', fare: 41250 },
      { value: 'Outpost', label: 'outpost Route', fare: 41250 },
      { value: 'Fathima College', label: 'Fathima Route', fare: 41250 },
      { value: 'Kudal Nagar', label: 'Kudal Nagar Route', fare: 41250 },
      { value: 'Tallakulam', label: 'Tallakulam Route', fare:41250 },
      { value: 'Periyar', label: 'Periyar Route', fare: 33000},
      { value: 'South Gate', label: 'South Route', fare: 36135 },
      { value: 'Kalavasal', label: 'Kalavasal Route', fare:36135 },
      { value: 'Doak Nagar', label: 'Doak Route', fare: 41250 },
      { value: 'Maatuthavani', label: 'Mattuthavani Route', fare: 41250 }



    ];
  }
}