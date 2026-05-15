// ============================================
// TATTVA ERP INTEGRATION — READY FOR FUTURE
// ============================================
// This service will connect to the Tattva ERP
// system (by Desai Software) via a middleware API.
// When ready, replace the hardcoded return below with:
//
// const response = await fetch(
//   TATTVA_API_BASE_URL +
//   `/api/deliveries?employeeId=${employeeId}&date=${date}`
// )
// const data = await response.json()
// return data.customers
//
// Expected customer object from Tattva API:
// {
//   id: string,
//   companyName: string,
//   city: string,
//   phoneNo: string,
//   jobNo: string,
//   receiptNo: string,
//   purity: string,
//   weightGm: number,
//   boxNo: string,
//   status: "Ready For Delivery"
// }
// ============================================

import { CUSTOMER_LIST } from '../constants/customers';

// Tattva API base URL — fill this when integration begins
export const TATTVA_API_BASE_URL = '';

// Flip to true when the Tattva API is ready and tested
export const TATTVA_INTEGRATION_ENABLED = false;

// TATTVA READY: Replace return statement with API call
//  GET /api/deliveries?employeeId={id}&date={date}
//  Expected response: [{ id, companyName, city, phoneNo,
//  jobNo, receiptNo, purity, weightGm, boxNo }]
export async function getTodaysCustomers(employeeId, date) {
  if (TATTVA_INTEGRATION_ENABLED && TATTVA_API_BASE_URL) {
    // TATTVA INTEGRATION POINT — replace this block in future
    // with the actual API call below:
    try {
      const response = await fetch(
        TATTVA_API_BASE_URL +
          `/api/deliveries?employeeId=${employeeId}&date=${date}`
      );
      if (!response.ok) {
        throw new Error(`Tattva API error: ${response.status}`);
      }
      const data = await response.json();
      return data.customers || [];
    } catch (error) {
      console.warn('[customerService] Tattva API failed, falling back to local list:', error.message);
      return CUSTOMER_LIST;
    }
  }

  // Currently returns the hardcoded list from constants/customers.js
  // TATTVA INTEGRATION POINT — replace this return in future
  return CUSTOMER_LIST;
}

export default { getTodaysCustomers, TATTVA_API_BASE_URL, TATTVA_INTEGRATION_ENABLED };
