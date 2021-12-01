## Pizza Day Wrangling

A collection of JavaScript for checking pizza orders for students, building a CSV for data merge, and exporting order sheets from Google Sheets.

### Pizza Day Procedure

Update CSV files for order:

    ./pull-spreadsheet-orders.js       # writes order data from sheets API to data/orders-spreadsheet.csv
    ./pull-mail-orders.js              # writes unfetched email bodies from GMail API to messages/${id}
    ./orders-from-messages.js          # writes order data from data/messages to data/orders-email.csv
    ./collapse-spreadsheet-orders.js   # writes orders with 1 line per kid to data/orders-collapsed.csv
    ./orders-for-labels.js             # writes orders for classes needing labels to data/orders-labels.csv

Fetch and combine order sheet PDFs:

    ./export-pdf.js                     # Export PDF from Sheets for each class tab and write to export directory.
    ./merge-pdf.js                      # Merge exported pdfs into export/all.pdf
