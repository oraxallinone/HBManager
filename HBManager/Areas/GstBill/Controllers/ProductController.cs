using AdminTemp.Areas.GstBill.Models;
using HBManager.Areas.GstBill.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Areas.GstBill.Controllers
{
    public class ProductController : Controller
    {
        cbtsplco_annapurnaEntities db = new cbtsplco_annapurnaEntities();

        #region------------------------Dashboard-------------------------
        public ActionResult Index()
        {
            return View();
        }
        #endregion-------------------------------------------------------

        #region------------------------Customer--------------------------
        public ActionResult CustomerAdd()
        {
            return View();
        }

        [HttpPost]
        public ActionResult CustomerAdd(CustomerMaster cust)
        {
            var checkDuplicate = duplicateCheckCust(cust.custName);
            if (!checkDuplicate)
            {
                cust.isActive = true;
                cust.createdDate = DateTime.Now;
                db.CustomerMasters.Add(cust);
                db.SaveChanges();
                return RedirectToAction("CustomerList");
            }
            ViewBag.isPresent = "Custpmer Name exist please chanege the Customer Name";
            return View();
        }

        public ActionResult CustomerList()
        {
            var custList = db.CustomerMasters.OrderBy(x => new { x.isActive, x.custName }).ToList().OrderByDescending(x => x.custId);
            return View(custList);
        }

        public ActionResult CustomerView(int id)
        {
            var cust = db.CustomerMasters.Where(x => x.custId == id).FirstOrDefault();
            if (cust == null)
            {
                // Option 1: Redirect to list
                return RedirectToAction("CustomerList");
                // Option 2: return View("NotFound");
            }
            return View(cust);
        }

        public ActionResult CustomerEdit(int id)
        {
            var cust = db.CustomerMasters.Where(x => x.custId == id).FirstOrDefault();
            return View(cust);
        }

        [HttpPost]
        public ActionResult CustomerEdit(CustomerMaster cust)
        {
            try
            {
                CustomerMaster cust2 = db.CustomerMasters.Where(x => x.custId == cust.custId).FirstOrDefault();
                cust2.custName = cust.custName;
                cust2.addr1 = cust.addr1;
                cust2.addr2 = cust.addr2;
                cust2.addr3 = cust.addr3;
                cust2.gstType = cust.gstType;
                cust2.gstIn = cust.gstIn;
                cust2.isActive = cust.isActive;
                cust2.updatedDate = DateTime.Now;
                db.SaveChanges();
                return RedirectToAction("CustomerList");
            }
            catch (Exception) { return View(); throw; }
        }

        private bool duplicateCheckCust(string CustName)
        {
            var isThere = db.CustomerMasters.Any(x => x.custName == CustName);
            return isThere;
        }

        [HttpPost]
        public ActionResult GetCustomers()
        {
            var custList = (from ss in db.CustomerMasters
                            select new CustomerDTO
                            {
                                addr1 = ss.addr1,
                                addr2 = ss.addr2,
                                addr3 = ss.addr3,
                                createdDate = ss.createdDate.ToString(),
                                updatedDate = ss.updatedDate.ToString(),
                                custId = ss.custId,
                                isActive = (bool)ss.isActive,
                                custName = ss.custName,
                                gstIn = ss.gstIn
                            }).ToList();
            return Json(custList);
        }
        #endregion-------------------------------------------------------
    }
}