import { cities } from '@/lib/civicLabels';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SignupProfileFieldsProps = {
  city: string;
  onCityChange: (city: string) => void;
  neighborhood: string;
  onNeighborhoodChange: (value: string) => void;
  cityRequired?: boolean;
  idPrefix?: string;
};

const SignupProfileFields = ({
  city,
  onCityChange,
  neighborhood,
  onNeighborhoodChange,
  cityRequired = false,
  idPrefix = 'profile',
}: SignupProfileFieldsProps) => (
  <>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-city`} className="text-sm font-medium text-foreground">
        City {cityRequired ? '' : '(optional)'}
        {cityRequired ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <Select value={city || '__none__'} onValueChange={(v) => onCityChange(v === '__none__' ? '' : v)}>
        <SelectTrigger id={`${idPrefix}-city`} className="h-11 rounded-lg bg-background">
          <SelectValue placeholder="Select your city" />
        </SelectTrigger>
        <SelectContent>
          {!cityRequired && <SelectItem value="__none__">Not specified</SelectItem>}
          {cities.map((c) => (
            <SelectItem key={c.id} value={c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-neighborhood`} className="text-sm font-medium text-foreground">
        Neighborhood (optional)
      </Label>
      <Input
        id={`${idPrefix}-neighborhood`}
        value={neighborhood}
        onChange={(e) => onNeighborhoodChange(e.target.value)}
        autoComplete="address-level3"
        placeholder="e.g. Model Town, Sector 17"
        className="h-11 rounded-lg bg-background"
      />
    </div>
  </>
);

export default SignupProfileFields;
