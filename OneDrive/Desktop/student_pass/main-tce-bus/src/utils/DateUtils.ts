// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

export class DateUtils {
  /**
   * Check if current date is within payment window (1st to 5th of month)
   */
  static isPaymentWindowOpen(): boolean {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth >= 1 && dayOfMonth <= 5;
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Check if payment is due (after 5th of current month and not paid)
   */
  static isPaymentOverdue(lastPaymentDate: string | null, paymentStatus: boolean): boolean {
    if (paymentStatus) return false;
    if (!lastPaymentDate) return true;

    const today = new Date();
    const lastPayment = new Date(lastPaymentDate);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const paymentMonth = lastPayment.getMonth();
    const paymentYear = lastPayment.getFullYear();

    // If last payment was not in current month/year and we're past the 5th
    if (paymentYear < currentYear || 
        (paymentYear === currentYear && paymentMonth < currentMonth)) {
      return today.getDate() > 5;
    }

    return false;
  }

  /**
   * Get next payment window dates
   */
  static getNextPaymentWindow(): string {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    return `${nextMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} 1st - 5th`;
  }
}