import { Ticket } from "@prisma/client";

interface TicketInfoProps {
  ticket: Ticket;
  role: "admin" | "user";
}

export function TicketInfo({ ticket, role }: TicketInfoProps) {
  return (
    <div className="p-6 border rounded-lg">
      <h4 className="text-lg font-semibold mb-4">Ticket Information</h4>
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {ticket.status}
        </div>
        <div>
          <strong>Created:</strong>{" "}
          {new Date(ticket.dateCreated).toLocaleDateString()}
        </div>
        <div>
          <strong>Last Updated:</strong>{" "}
          {new Date(ticket.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
