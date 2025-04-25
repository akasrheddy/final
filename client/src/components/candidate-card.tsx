import { Badge } from "@/components/ui/badge";

interface Candidate {
  id: number;
  name: string;
  party: string;
  description: string;
}

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
}

export default function CandidateCard({ candidate, isSelected, onSelect }: CandidateCardProps) {
  return (
    <div 
      className={`border rounded-lg p-4 hover:border-primary cursor-pointer transition ${isSelected ? 'border-primary' : ''}`}
      onClick={onSelect}
      data-id={candidate.id}
    >
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 rounded-full bg-neutral-lighter flex items-center justify-center overflow-hidden mr-4">
          <span className="material-icons text-4xl text-neutral-medium">person</span>
        </div>
        <div>
          <h3 className="font-semibold text-lg">{candidate.name}</h3>
          <p className="text-sm text-neutral-medium">{candidate.party}</p>
        </div>
      </div>
      <p className="text-sm text-neutral-medium mb-3">{candidate.description}</p>
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="bg-neutral-lighter px-2 py-1 rounded-full text-xs">
          ID: {candidate.id}
        </Badge>
        <div className={`h-6 w-6 border-2 rounded-full ${isSelected ? 'bg-primary border-primary' : 'border-neutral-light'}`}></div>
      </div>
    </div>
  );
}
