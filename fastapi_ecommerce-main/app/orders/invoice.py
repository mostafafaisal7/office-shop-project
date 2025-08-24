from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from io import BytesIO
from app.orders.models import Order


def generate_invoice_pdf(order: Order) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)

    styles = getSampleStyleSheet()
    elements = []

    # Custom right-aligned style
    right_style = ParagraphStyle(name='Right', parent=styles['Normal'], alignment=2)

    # === Header ===
    elements.append(Paragraph("INVOICE", styles["Title"]))
    elements.append(Spacer(1, 12))

    order_date = order.created_at.strftime("%d-%m-%Y")

    # Left and Right columns for header info
    header_data = [
        [
            Paragraph("<b>Email:</b> info@sobujkanon.com", styles["Normal"]),
            Paragraph(f"<b>Order ID:</b> {order.id}", right_style)
        ],
        [
            Paragraph("<b>Phone:</b> +8801914-986663", styles["Normal"]),
            Paragraph(f"<b>Order Date:</b> {order_date}", right_style)
        ],
        [
            Paragraph("<b>Payment Method:</b> Cash on Delivery", styles["Normal"]),
            ""
        ]
    ]

    header_table = Table(header_data, colWidths=[doc.width / 2, doc.width / 2])
    header_table.setStyle(TableStyle([('ALIGN', (1, 0), (1, -1), 'RIGHT')]))
    elements.append(header_table)
    elements.append(Spacer(1, 16))

    # === Billing Info ===
    elements.append(Paragraph("<b>Bill to:</b>", styles["Normal"]))
    elements.append(Paragraph("Card Holder", styles["Normal"]))
    elements.append(Paragraph("dvdxvxd, zdzdzD, Bagar Hat - , Bangladesh", styles["Normal"]))
    elements.append(Paragraph("Email: niloy940@gmail.com", styles["Normal"]))
    elements.append(Paragraph("Phone: 01676944727", styles["Normal"]))
    elements.append(Spacer(1, 16))

    # === Product Table ===
    product_data = [["Product Name", "Delivery Type", "QTY", "Unit Price", "Tax", "Total"]]

    subtotal = 0.0
    for item in order.items:
        name = f"Product ID: {item.product_id}"  # Replace with real product name if available
        delivery_type = "Home Delivery"
        qty = item.quantity
        unit_price = item.unit_price
        tax = 0.00
        total = qty * unit_price
        subtotal += total

        product_data.append([
            name, delivery_type, str(qty),
            f"৳{unit_price:,.2f}", f"৳{tax:,.2f}", f"৳{total:,.2f}"
        ])

    # Stretch table to full width
    # Stretch across full page width dynamically
    total_width = doc.width
    col_widths = [
        total_width * 0.30,  # Product Name
        total_width * 0.20,  # Delivery Type
        total_width * 0.10,  # QTY
        total_width * 0.15,  # Unit Price
        total_width * 0.10,  # Tax
        total_width * 0.15,  # Total
    ]

    product_table = Table(product_data, colWidths=col_widths)

    product_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(product_table)
    elements.append(Spacer(1, 20))

    # === Summary Table ===
    summary_data = [
        ["Sub Total", f"৳{subtotal:,.2f}"],
        ["Shipping Cost", "৳0.00"],
        ["Total Tax", "৳0.00"],
        ["Coupon Discount", "৳0.00"],
        ["Grand Total", f"৳{subtotal:,.2f}"]
    ]

    summary_table = Table(summary_data, colWidths=[doc.width / 2, 100], hAlign="RIGHT")
    summary_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
    ]))

    elements.append(summary_table)
    elements.append(Spacer(1, 16))
    elements.append(Paragraph("Thank you for your purchase!", styles["Normal"]))

    # Generate PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
