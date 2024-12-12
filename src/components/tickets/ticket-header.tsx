import { Ticket } from "@prisma/client";

interface TicketHeaderProps {
  ticket: Ticket;
  role: "admin" | "user";
}

export function TicketHeader({ ticket, role }: TicketHeaderProps) {
  return (
    <div className="p-6 border-b">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        Ticket #{ticket.id}
      </h3>
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {ticket.status}
        </div>
        <div>
          <strong>Created:</strong>{" "}
          {new Date(ticket.dateCreated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
