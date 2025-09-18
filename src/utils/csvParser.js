// CSV Parser and Validation Utilities

export const parseCSV = (csvText, customerType = "CPA") => {
  try {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new Error(
        "CSV must contain at least a header row and one data row"
      );
    }

    // Parse header row
    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().toLowerCase());

    // Validate required headers
    const requiredHeaders =
      customerType === "CPA"
        ? ["cpanumber", "name", "surname"]
        : ["name", "surname"];

    const missingRequired = requiredHeaders.filter(
      (req) => !headers.includes(req)
    );
    if (missingRequired.length > 0) {
      throw new Error(
        `Missing required columns: ${missingRequired.join(", ")}`
      );
    }

    // Parse data rows
    const customers = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue; // Skip empty rows

      try {
        const values = parseCSVRow(row);

        if (values.length !== headers.length) {
          errors.push({
            row: i + 1,
            error: `Row has ${values.length} columns, expected ${headers.length}`,
          });
          continue;
        }

        // Create customer object
        const customer = { type: customerType };

        headers.forEach((header, index) => {
          const value = values[index]?.trim();

          switch (header) {
            case "cpanumber":
              customer.cpaNumber = value;
              break;
            case "title":
              customer.title = value;
              break;
            case "name":
              customer.name = value;
              break;
            case "surname":
              customer.surname = value;
              break;
            case "email":
              customer.email = value || null;
              break;
            case "phone":
              customer.phone = value || null;
              break;
            case "lineid":
              customer.lineID = value || null;
              break;
            case "customerid":
              customer.customerID = value || null;
              break;
            case "hownice":
              customer.howNice = value ? parseInt(value, 10) : null;
              break;
            case "address":
              customer.address = value || null;
              break;
            case "companyname":
              customer.companyName = value || null;
              break;
            case "companyid":
              customer.companyId = value || null;
              break;
            case "companyaddress":
              customer.companyAddress = value || null;
              break;
            default:
              // Handle any other fields as custom fields
              if (value) {
                customer.customFields = customer.customFields || {};
                customer.customFields[header] = value;
              }
          }
        });

        // Validate customer data
        const validationErrors = validateCustomerData(customer);
        if (validationErrors.length > 0) {
          errors.push({
            row: i + 1,
            error: validationErrors.join(", "),
            data: customer,
          });
          continue;
        }

        customers.push(customer);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    return {
      customers,
      errors,
      totalRows: lines.length - 1,
      successfulRows: customers.length,
    };
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
};

// Parse a single CSV row, handling quoted values with commas
const parseCSVRow = (row) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current); // Add the last value
  return values;
};

// Validate customer data
const validateCustomerData = (customer) => {
  const errors = [];

  // Required field validation
  if (!customer.name?.trim()) {
    errors.push("Name is required");
  }

  if (!customer.surname?.trim()) {
    errors.push("Surname is required");
  }

  // CPA specific validation
  if (customer.type === "CPA" && !customer.cpaNumber?.trim()) {
    errors.push("CPA Number is required for CPA customers");
  }

  // Email validation (if provided)
  if (customer.email && !isValidEmail(customer.email)) {
    errors.push("Invalid email format");
  }

  // Phone validation (if provided)
  if (customer.phone && !isValidPhone(customer.phone)) {
    errors.push("Invalid phone format");
  }

  return errors;
};

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (basic format check)
const isValidPhone = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");
  // Check if it's between 10-15 digits
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

// Generate CSV template
export const generateCSVTemplate = (customerType = "CPA") => {
  const allFields = [
    "type",
    "cpaNumber",
    "title",
    "name",
    "surname",
    "email",
    "phone",
    "lineID",
    "customerID",
    "howNice",
    "address",
    "companyName",
    "companyId",
    "companyAddress",
  ];

  const headers =
    customerType === "CPA"
      ? allFields
      : allFields.filter((field) => field !== "cpaNumber");

  const sampleData =
    customerType === "CPA"
      ? [
          "CPA",
          "CPA123456",
          "Mr.",
          "John",
          "Smith",
          "john.smith@example.com",
          "+1234567890",
          "john.smith",
          "CUST001",
          "8",
          "123 Main St, Anytown, USA",
          "Smith & Co.",
          "COMP001",
          "456 Business Rd, Anytown, USA",
        ]
      : [
          "NonCPA",
          "",
          "Ms.",
          "Jane",
          "Doe",
          "jane.doe@example.com",
          "+1234567891",
          "jane.doe",
          "CUST002",
          "9",
          "789 Oak Ave, Anytown, USA",
          "Doe Industries",
          "COMP002",
          "101 Enterprise Way, Anytown, USA",
        ];

  return `${headers.join(",")}\n${sampleData.join(",")}`;
};

// Download CSV template
export const downloadCSVTemplate = (customerType = "CPA") => {
  const csvContent = generateCSVTemplate(customerType);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${customerType}_template.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export customers to CSV
export const exportCustomersToCSV = (customers, filename = "customers.csv") => {
  if (!customers || customers.length === 0) {
    throw new Error("No customers to export");
  }

  // Get all unique headers
  const allHeaders = new Set([
    "type",
    "cpaNumber",
    "title",
    "name",
    "surname",
    "email",
    "phone",
  ]);

  // Add custom field headers
  customers.forEach((customer) => {
    if (customer.customFields) {
      Object.keys(customer.customFields).forEach((field) =>
        allHeaders.add(field)
      );
    }
  });

  const headers = Array.from(allHeaders);

  // Generate CSV content
  const csvRows = [headers.join(",")];

  customers.forEach((customer) => {
    const row = headers.map((header) => {
      let value = "";

      switch (header) {
        case "type":
          value = customer.type || "";
          break;
        case "cpaNumber":
          value = customer.cpaNumber || "";
          break;
        case "title":
          value = customer.title || "";
          break;
        case "name":
          value = customer.name || "";
          break;
        case "surname":
          value = customer.surname || "";
          break;
        case "email":
          value = customer.email || "";
          break;
        case "phone":
          value = customer.phone || "";
          break;
        default:
          value = customer.customFields?.[header] || "";
      }

      // Escape commas and quotes in values
      if (value.includes(",") || value.includes('"')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });

    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
