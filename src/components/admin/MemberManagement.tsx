import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '@/hooks/useAdminData';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/lib/api-client";
import { isPremiumUser, getPlanDisplayName } from "@/utils/premiumUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UserProfileCard from './UserProfileCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EditUserDialog from './EditUserDialog';
import SendEmailDialog from './SendEmailDialog';
import { Search, Edit, Trash2, Users, Eye, Mail, User } from 'lucide-react';
import ReactSelect from 'react-select';

interface MemberManagementProps {
  stats: any;
}

const countryOptions = [
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Albania', label: 'Albania' },
  { value: 'Algeria', label: 'Algeria' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Canada', label: 'Canada' },
  { value: 'China', label: 'China' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'Finland', label: 'Finland' },
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'India', label: 'India' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Iran', label: 'Iran' },
  { value: 'Iraq', label: 'Iraq' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Jordan', label: 'Jordan' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Lebanon', label: 'Lebanon' },
  { value: 'Libya', label: 'Libya' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Morocco', label: 'Morocco' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Oman', label: 'Oman' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Palestine', label: 'Palestine' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Somalia', label: 'Somalia' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Sudan', label: 'Sudan' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Syria', label: 'Syria' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Tunisia', label: 'Tunisia' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'USA', label: 'United States' },
  { value: 'Yemen', label: 'Yemen' },
];

const cityOptions: { [key: string]: { value: string; label: string }[] } = {
  Afghanistan: [
    { value: 'Kabul', label: 'Kabul' },
    { value: 'Kandahar', label: 'Kandahar' },
    { value: 'Herat', label: 'Herat' },
    { value: 'Mazar-i-Sharif', label: 'Mazar-i-Sharif' },
    { value: 'Kunduz', label: 'Kunduz' },
    { value: 'Jalalabad', label: 'Jalalabad' },
    { value: 'Ghazni', label: 'Ghazni' },
    { value: 'Bamyan', label: 'Bamyan' },
  ],
  Albania: [
    { value: 'Tirana', label: 'Tirana' },
    { value: 'Durres', label: 'Durres' },
    { value: 'Vlore', label: 'Vlore' },
    { value: 'Shkoder', label: 'Shkoder' },
    { value: 'Fier', label: 'Fier' },
    { value: 'Korce', label: 'Korce' },
    { value: 'Berat', label: 'Berat' },
    { value: 'Gjirokaster', label: 'Gjirokaster' },
  ],
  Algeria: [
    { value: 'Algiers', label: 'Algiers' },
    { value: 'Oran', label: 'Oran' },
    { value: 'Constantine', label: 'Constantine' },
    { value: 'Annaba', label: 'Annaba' },
    { value: 'Blida', label: 'Blida' },
    { value: 'Batna', label: 'Batna' },
    { value: 'Djelfa', label: 'Djelfa' },
    { value: 'Setif', label: 'Setif' },
    { value: 'Sidi Bel Abbes', label: 'Sidi Bel Abbes' },
    { value: 'Biskra', label: 'Biskra' },
    { value: 'Tebessa', label: 'Tebessa' },
    { value: 'El Oued', label: 'El Oued' },
    { value: 'Skikda', label: 'Skikda' },
    { value: 'Tiaret', label: 'Tiaret' },
    { value: 'Bejaia', label: 'Bejaia' },
  ],
  Argentina: [
    { value: 'Buenos Aires', label: 'Buenos Aires' },
    { value: 'Cordoba', label: 'Cordoba' },
    { value: 'Rosario', label: 'Rosario' },
    { value: 'Mendoza', label: 'Mendoza' },
    { value: 'Tucuman', label: 'Tucuman' },
    { value: 'La Plata', label: 'La Plata' },
    { value: 'Mar del Plata', label: 'Mar del Plata' },
    { value: 'Salta', label: 'Salta' },
    { value: 'Santa Fe', label: 'Santa Fe' },
    { value: 'San Juan', label: 'San Juan' },
    { value: 'Resistencia', label: 'Resistencia' },
    { value: 'Santiago del Estero', label: 'Santiago del Estero' },
    { value: 'Corrientes', label: 'Corrientes' },
    { value: 'Posadas', label: 'Posadas' },
    { value: 'Neuquen', label: 'Neuquen' },
  ],
  Australia: [
    { value: 'Sydney', label: 'Sydney' },
    { value: 'Melbourne', label: 'Melbourne' },
    { value: 'Brisbane', label: 'Brisbane' },
    { value: 'Perth', label: 'Perth' },
    { value: 'Adelaide', label: 'Adelaide' },
    { value: 'Gold Coast', label: 'Gold Coast' },
    { value: 'Newcastle', label: 'Newcastle' },
    { value: 'Canberra', label: 'Canberra' },
    { value: 'Central Coast', label: 'Central Coast' },
    { value: 'Wollongong', label: 'Wollongong' },
    { value: 'Logan City', label: 'Logan City' },
    { value: 'Geelong', label: 'Geelong' },
    { value: 'Hobart', label: 'Hobart' },
    { value: 'Townsville', label: 'Townsville' },
    { value: 'Cairns', label: 'Cairns' },
    { value: 'Darwin', label: 'Darwin' },
    { value: 'Toowoomba', label: 'Toowoomba' },
    { value: 'Ballarat', label: 'Ballarat' },
    { value: 'Bendigo', label: 'Bendigo' },
    { value: 'Albury', label: 'Albury' },
  ],
  Austria: [
    { value: 'Vienna', label: 'Vienna' },
    { value: 'Salzburg', label: 'Salzburg' },
    { value: 'Innsbruck', label: 'Innsbruck' },
    { value: 'Graz', label: 'Graz' },
    { value: 'Linz', label: 'Linz' },
    { value: 'Klagenfurt', label: 'Klagenfurt' },
    { value: 'Villach', label: 'Villach' },
    { value: 'Wels', label: 'Wels' },
    { value: 'Sankt Polten', label: 'Sankt Polten' },
    { value: 'Dornbirn', label: 'Dornbirn' },
    { value: 'Wiener Neustadt', label: 'Wiener Neustadt' },
    { value: 'Steyr', label: 'Steyr' },
    { value: 'Feldkirch', label: 'Feldkirch' },
    { value: 'Bregenz', label: 'Bregenz' },
    { value: 'Wolfsberg', label: 'Wolfsberg' },
  ],
  Bahrain: [
    { value: 'Manama', label: 'Manama' },
    { value: 'Riffa', label: 'Riffa' },
    { value: 'Muharraq', label: 'Muharraq' },
    { value: 'Hamad Town', label: 'Hamad Town' },
    { value: 'A\'ali', label: 'A\'ali' },
    { value: 'Isa Town', label: 'Isa Town' },
    { value: 'Sitra', label: 'Sitra' },
    { value: 'Budaiya', label: 'Budaiya' },
    { value: 'Jidhafs', label: 'Jidhafs' },
    { value: 'Al-Malikiyah', label: 'Al-Malikiyah' },
  ],
  Bangladesh: [
    { value: 'Dhaka', label: 'Dhaka' },
    { value: 'Chittagong', label: 'Chittagong' },
    { value: 'Sylhet', label: 'Sylhet' },
    { value: 'Khulna', label: 'Khulna' },
    { value: 'Rajshahi', label: 'Rajshahi' },
    { value: 'Rangpur', label: 'Rangpur' },
    { value: 'Barisal', label: 'Barisal' },
    { value: 'Comilla', label: 'Comilla' },
    { value: 'Mymensingh', label: 'Mymensingh' },
    { value: 'Gazipur', label: 'Gazipur' },
    { value: 'Narayanganj', label: 'Narayanganj' },
    { value: 'Jessore', label: 'Jessore' },
    { value: 'Bogra', label: 'Bogra' },
    { value: 'Dinajpur', label: 'Dinajpur' },
    { value: 'Pabna', label: 'Pabna' },
    { value: 'Tangail', label: 'Tangail' },
    { value: 'Jamalpur', label: 'Jamalpur' },
    { value: 'Kishoreganj', label: 'Kishoreganj' },
    { value: 'Faridpur', label: 'Faridpur' },
    { value: 'Kushtia', label: 'Kushtia' },
  ],
  Belgium: [
    { value: 'Brussels', label: 'Brussels' },
    { value: 'Antwerp', label: 'Antwerp' },
    { value: 'Ghent', label: 'Ghent' },
    { value: 'Charleroi', label: 'Charleroi' },
    { value: 'Liege', label: 'Liege' },
    { value: 'Bruges', label: 'Bruges' },
    { value: 'Namur', label: 'Namur' },
    { value: 'Leuven', label: 'Leuven' },
    { value: 'Mons', label: 'Mons' },
    { value: 'Aalst', label: 'Aalst' },
    { value: 'La Louviere', label: 'La Louviere' },
    { value: 'Kortrijk', label: 'Kortrijk' },
    { value: 'Hasselt', label: 'Hasselt' },
    { value: 'Sint-Niklaas', label: 'Sint-Niklaas' },
    { value: 'Ostend', label: 'Ostend' },
  ],
  Brazil: [
    { value: 'Sao Paulo', label: 'São Paulo' },
    { value: 'Rio de Janeiro', label: 'Rio de Janeiro' },
    { value: 'Brasilia', label: 'Brasília' },
    { value: 'Salvador', label: 'Salvador' },
    { value: 'Fortaleza', label: 'Fortaleza' },
    { value: 'Belo Horizonte', label: 'Belo Horizonte' },
    { value: 'Manaus', label: 'Manaus' },
    { value: 'Curitiba', label: 'Curitiba' },
    { value: 'Recife', label: 'Recife' },
    { value: 'Porto Alegre', label: 'Porto Alegre' },
    { value: 'Belém', label: 'Belém' },
    { value: 'Goiânia', label: 'Goiânia' },
    { value: 'Guarulhos', label: 'Guarulhos' },
    { value: 'Campinas', label: 'Campinas' },
    { value: 'São Luís', label: 'São Luís' },
    { value: 'São Gonçalo', label: 'São Gonçalo' },
    { value: 'Maceió', label: 'Maceió' },
    { value: 'Duque de Caxias', label: 'Duque de Caxias' },
    { value: 'Natal', label: 'Natal' },
    { value: 'Teresina', label: 'Teresina' },
  ],
  Canada: [
    { value: 'Toronto', label: 'Toronto' },
    { value: 'Vancouver', label: 'Vancouver' },
    { value: 'Montreal', label: 'Montreal' },
    { value: 'Calgary', label: 'Calgary' },
    { value: 'Ottawa', label: 'Ottawa' },
    { value: 'Edmonton', label: 'Edmonton' },
    { value: 'Mississauga', label: 'Mississauga' },
    { value: 'Winnipeg', label: 'Winnipeg' },
    { value: 'Quebec City', label: 'Quebec City' },
    { value: 'Hamilton', label: 'Hamilton' },
    { value: 'Brampton', label: 'Brampton' },
    { value: 'Surrey', label: 'Surrey' },
    { value: 'Laval', label: 'Laval' },
    { value: 'Halifax', label: 'Halifax' },
    { value: 'London', label: 'London' },
    { value: 'Markham', label: 'Markham' },
    { value: 'Vaughan', label: 'Vaughan' },
    { value: 'Gatineau', label: 'Gatineau' },
    { value: 'Saskatoon', label: 'Saskatoon' },
    { value: 'Longueuil', label: 'Longueuil' },
    { value: 'Burnaby', label: 'Burnaby' },
    { value: 'Regina', label: 'Regina' },
    { value: 'Richmond', label: 'Richmond' },
    { value: 'Richmond Hill', label: 'Richmond Hill' },
    { value: 'Oakville', label: 'Oakville' },
  ],
  China: [
    { value: 'Beijing', label: 'Beijing' },
    { value: 'Shanghai', label: 'Shanghai' },
    { value: 'Guangzhou', label: 'Guangzhou' },
    { value: 'Shenzhen', label: 'Shenzhen' },
    { value: 'Tianjin', label: 'Tianjin' },
    { value: 'Wuhan', label: 'Wuhan' },
    { value: 'Dongguan', label: 'Dongguan' },
    { value: 'Chengdu', label: 'Chengdu' },
    { value: 'Nanjing', label: 'Nanjing' },
    { value: 'Chongqing', label: 'Chongqing' },
    { value: 'Xian', label: 'Xian' },
    { value: 'Suzhou', label: 'Suzhou' },
    { value: 'Hangzhou', label: 'Hangzhou' },
    { value: 'Qingdao', label: 'Qingdao' },
    { value: 'Dalian', label: 'Dalian' },
    { value: 'Zhengzhou', label: 'Zhengzhou' },
    { value: 'Shantou', label: 'Shantou' },
    { value: 'Jinan', label: 'Jinan' },
    { value: 'Changchun', label: 'Changchun' },
    { value: 'Kunming', label: 'Kunming' },
    { value: 'Changsha', label: 'Changsha' },
    { value: 'Taiyuan', label: 'Taiyuan' },
    { value: 'Xiamen', label: 'Xiamen' },
    { value: 'Shijiazhuang', label: 'Shijiazhuang' },
    { value: 'Ningbo', label: 'Ningbo' },
  ],
  Denmark: [
    { value: 'Copenhagen', label: 'Copenhagen' },
    { value: 'Aarhus', label: 'Aarhus' },
    { value: 'Odense', label: 'Odense' },
    { value: 'Aalborg', label: 'Aalborg' },
    { value: 'Esbjerg', label: 'Esbjerg' },
    { value: 'Randers', label: 'Randers' },
    { value: 'Kolding', label: 'Kolding' },
    { value: 'Horsens', label: 'Horsens' },
    { value: 'Vejle', label: 'Vejle' },
    { value: 'Roskilde', label: 'Roskilde' },
    { value: 'Herning', label: 'Herning' },
    { value: 'Silkeborg', label: 'Silkeborg' },
    { value: 'Naestved', label: 'Naestved' },
    { value: 'Fredericia', label: 'Fredericia' },
    { value: 'Viborg', label: 'Viborg' },
  ],
  Egypt: [
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Alexandria', label: 'Alexandria' },
    { value: 'Giza', label: 'Giza' },
    { value: 'Shubra El-Kheima', label: 'Shubra El-Kheima' },
    { value: 'Port Said', label: 'Port Said' },
    { value: 'Suez', label: 'Suez' },
    { value: 'Luxor', label: 'Luxor' },
    { value: 'Mansoura', label: 'Mansoura' },
    { value: 'El-Mahalla El-Kubra', label: 'El-Mahalla El-Kubra' },
    { value: 'Tanta', label: 'Tanta' },
    { value: 'Asyut', label: 'Asyut' },
    { value: 'Ismailia', label: 'Ismailia' },
    { value: 'Fayyum', label: 'Fayyum' },
    { value: 'Zagazig', label: 'Zagazig' },
    { value: 'Aswan', label: 'Aswan' },
    { value: 'Damietta', label: 'Damietta' },
    { value: 'Damanhur', label: 'Damanhur' },
    { value: 'Minya', label: 'Minya' },
    { value: 'Beni Suef', label: 'Beni Suef' },
    { value: 'Hurghada', label: 'Hurghada' },
  ],
  Finland: [
    { value: 'Helsinki', label: 'Helsinki' },
    { value: 'Espoo', label: 'Espoo' },
    { value: 'Tampere', label: 'Tampere' },
    { value: 'Vantaa', label: 'Vantaa' },
    { value: 'Oulu', label: 'Oulu' },
    { value: 'Turku', label: 'Turku' },
    { value: 'Jyväskylä', label: 'Jyväskylä' },
    { value: 'Lahti', label: 'Lahti' },
    { value: 'Kuopio', label: 'Kuopio' },
    { value: 'Pori', label: 'Pori' },
    { value: 'Joensuu', label: 'Joensuu' },
    { value: 'Lappeenranta', label: 'Lappeenranta' },
    { value: 'Hämeenlinna', label: 'Hämeenlinna' },
    { value: 'Vaasa', label: 'Vaasa' },
    { value: 'Seinäjoki', label: 'Seinäjoki' },
  ],
  France: [
    { value: 'Paris', label: 'Paris' },
    { value: 'Lyon', label: 'Lyon' },
    { value: 'Marseille', label: 'Marseille' },
    { value: 'Nice', label: 'Nice' },
    { value: 'Toulouse', label: 'Toulouse' },
    { value: 'Nantes', label: 'Nantes' },
    { value: 'Strasbourg', label: 'Strasbourg' },
    { value: 'Montpellier', label: 'Montpellier' },
    { value: 'Bordeaux', label: 'Bordeaux' },
    { value: 'Lille', label: 'Lille' },
    { value: 'Rennes', label: 'Rennes' },
    { value: 'Reims', label: 'Reims' },
    { value: 'Le Havre', label: 'Le Havre' },
    { value: 'Saint-Étienne', label: 'Saint-Étienne' },
    { value: 'Toulon', label: 'Toulon' },
    { value: 'Angers', label: 'Angers' },
    { value: 'Grenoble', label: 'Grenoble' },
    { value: 'Dijon', label: 'Dijon' },
    { value: 'Nîmes', label: 'Nîmes' },
    { value: 'Aix-en-Provence', label: 'Aix-en-Provence' },
    { value: 'Cannes', label: 'Cannes' },
    { value: 'Brest', label: 'Brest' },
    { value: 'Le Mans', label: 'Le Mans' },
    { value: 'Amiens', label: 'Amiens' },
    { value: 'Tours', label: 'Tours' },
  ],
  Germany: [
    { value: 'Berlin', label: 'Berlin' },
    { value: 'Munich', label: 'Munich' },
    { value: 'Hamburg', label: 'Hamburg' },
    { value: 'Cologne', label: 'Cologne' },
    { value: 'Frankfurt', label: 'Frankfurt' },
    { value: 'Stuttgart', label: 'Stuttgart' },
    { value: 'Düsseldorf', label: 'Düsseldorf' },
    { value: 'Dortmund', label: 'Dortmund' },
    { value: 'Essen', label: 'Essen' },
    { value: 'Leipzig', label: 'Leipzig' },
    { value: 'Bremen', label: 'Bremen' },
    { value: 'Dresden', label: 'Dresden' },
    { value: 'Hanover', label: 'Hanover' },
    { value: 'Nuremberg', label: 'Nuremberg' },
    { value: 'Duisburg', label: 'Duisburg' },
    { value: 'Bochum', label: 'Bochum' },
    { value: 'Wuppertal', label: 'Wuppertal' },
    { value: 'Bielefeld', label: 'Bielefeld' },
    { value: 'Bonn', label: 'Bonn' },
    { value: 'Münster', label: 'Münster' },
    { value: 'Karlsruhe', label: 'Karlsruhe' },
    { value: 'Mannheim', label: 'Mannheim' },
    { value: 'Augsburg', label: 'Augsburg' },
    { value: 'Wiesbaden', label: 'Wiesbaden' },
    { value: 'Gelsenkirchen', label: 'Gelsenkirchen' },
  ],
  Ghana: [
    { value: 'Accra', label: 'Accra' },
    { value: 'Kumasi', label: 'Kumasi' },
    { value: 'Tamale', label: 'Tamale' },
  ],
  India: [
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Bangalore', label: 'Bangalore' },
    { value: 'Hyderabad', label: 'Hyderabad' },
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Kolkata', label: 'Kolkata' },
  ],
  Indonesia: [
    { value: 'Jakarta', label: 'Jakarta' },
    { value: 'Surabaya', label: 'Surabaya' },
    { value: 'Bandung', label: 'Bandung' },
  ],
  Iran: [
    { value: 'Tehran', label: 'Tehran' },
    { value: 'Mashhad', label: 'Mashhad' },
    { value: 'Isfahan', label: 'Isfahan' },
  ],
  Iraq: [
    { value: 'Baghdad', label: 'Baghdad' },
    { value: 'Basra', label: 'Basra' },
    { value: 'Mosul', label: 'Mosul' },
  ],
  Ireland: [
    { value: 'Dublin', label: 'Dublin' },
    { value: 'Cork', label: 'Cork' },
    { value: 'Galway', label: 'Galway' },
  ],
  Italy: [
    { value: 'Rome', label: 'Rome' },
    { value: 'Milan', label: 'Milan' },
    { value: 'Naples', label: 'Naples' },
    { value: 'Turin', label: 'Turin' },
  ],
  Japan: [
    { value: 'Tokyo', label: 'Tokyo' },
    { value: 'Osaka', label: 'Osaka' },
    { value: 'Kyoto', label: 'Kyoto' },
    { value: 'Yokohama', label: 'Yokohama' },
  ],
  Jordan: [
    { value: 'Amman', label: 'Amman' },
    { value: 'Zarqa', label: 'Zarqa' },
    { value: 'Irbid', label: 'Irbid' },
  ],
  Kenya: [
    { value: 'Nairobi', label: 'Nairobi' },
    { value: 'Mombasa', label: 'Mombasa' },
    { value: 'Kisumu', label: 'Kisumu' },
  ],
  Kuwait: [
    { value: 'Kuwait City', label: 'Kuwait City' },
    { value: 'Hawalli', label: 'Hawalli' },
  ],
  Lebanon: [
    { value: 'Beirut', label: 'Beirut' },
    { value: 'Tripoli', label: 'Tripoli' },
    { value: 'Sidon', label: 'Sidon' },
  ],
  Libya: [
    { value: 'Tripoli', label: 'Tripoli' },
    { value: 'Benghazi', label: 'Benghazi' },
    { value: 'Misrata', label: 'Misrata' },
  ],
  Malaysia: [
    { value: 'Kuala Lumpur', label: 'Kuala Lumpur' },
    { value: 'George Town', label: 'George Town' },
    { value: 'Johor Bahru', label: 'Johor Bahru' },
  ],
  Morocco: [
    { value: 'Casablanca', label: 'Casablanca' },
    { value: 'Rabat', label: 'Rabat' },
    { value: 'Marrakech', label: 'Marrakech' },
    { value: 'Fez', label: 'Fez' },
  ],
  Netherlands: [
    { value: 'Amsterdam', label: 'Amsterdam' },
    { value: 'Rotterdam', label: 'Rotterdam' },
    { value: 'The Hague', label: 'The Hague' },
    { value: 'Utrecht', label: 'Utrecht' },
  ],
  'New Zealand': [
    { value: 'Auckland', label: 'Auckland' },
    { value: 'Wellington', label: 'Wellington' },
    { value: 'Christchurch', label: 'Christchurch' },
  ],
  Nigeria: [
    { value: 'Lagos', label: 'Lagos' },
    { value: 'Abuja', label: 'Abuja' },
    { value: 'Kano', label: 'Kano' },
    { value: 'Ibadan', label: 'Ibadan' },
    { value: 'Port Harcourt', label: 'Port Harcourt' },
  ],
  Norway: [
    { value: 'Oslo', label: 'Oslo' },
    { value: 'Bergen', label: 'Bergen' },
    { value: 'Trondheim', label: 'Trondheim' },
  ],
  Oman: [
    { value: 'Muscat', label: 'Muscat' },
    { value: 'Salalah', label: 'Salalah' },
  ],
  Pakistan: [
    { value: 'Karachi', label: 'Karachi' },
    { value: 'Lahore', label: 'Lahore' },
    { value: 'Islamabad', label: 'Islamabad' },
    { value: 'Rawalpindi', label: 'Rawalpindi' },
    { value: 'Faisalabad', label: 'Faisalabad' },
  ],
  Palestine: [
    { value: 'Gaza', label: 'Gaza' },
    { value: 'Ramallah', label: 'Ramallah' },
    { value: 'Hebron', label: 'Hebron' },
  ],
  Philippines: [
    { value: 'Manila', label: 'Manila' },
    { value: 'Quezon City', label: 'Quezon City' },
    { value: 'Cebu City', label: 'Cebu City' },
  ],
  Poland: [
    { value: 'Warsaw', label: 'Warsaw' },
    { value: 'Krakow', label: 'Krakow' },
    { value: 'Gdansk', label: 'Gdansk' },
  ],
  Qatar: [
    { value: 'Doha', label: 'Doha' },
    { value: 'Al Rayyan', label: 'Al Rayyan' },
  ],
  Russia: [
    { value: 'Moscow', label: 'Moscow' },
    { value: 'St. Petersburg', label: 'St. Petersburg' },
    { value: 'Novosibirsk', label: 'Novosibirsk' },
  ],
  'Saudi Arabia': [
    { value: 'Riyadh', label: 'Riyadh' },
    { value: 'Jeddah', label: 'Jeddah' },
    { value: 'Mecca', label: 'Mecca' },
    { value: 'Medina', label: 'Medina' },
    { value: 'Dammam', label: 'Dammam' },
  ],
  Singapore: [
    { value: 'Singapore', label: 'Singapore' },
  ],
  Somalia: [
    { value: 'Mogadishu', label: 'Mogadishu' },
    { value: 'Hargeisa', label: 'Hargeisa' },
  ],
  'South Africa': [
    { value: 'Cape Town', label: 'Cape Town' },
    { value: 'Johannesburg', label: 'Johannesburg' },
    { value: 'Durban', label: 'Durban' },
  ],
  'South Korea': [
    { value: 'Seoul', label: 'Seoul' },
    { value: 'Busan', label: 'Busan' },
    { value: 'Incheon', label: 'Incheon' },
  ],
  Spain: [
    { value: 'Madrid', label: 'Madrid' },
    { value: 'Barcelona', label: 'Barcelona' },
    { value: 'Valencia', label: 'Valencia' },
    { value: 'Seville', label: 'Seville' },
  ],
  Sudan: [
    { value: 'Khartoum', label: 'Khartoum' },
    { value: 'Omdurman', label: 'Omdurman' },
  ],
  Sweden: [
    { value: 'Stockholm', label: 'Stockholm' },
    { value: 'Gothenburg', label: 'Gothenburg' },
    { value: 'Malmo', label: 'Malmö' },
  ],
  Switzerland: [
    { value: 'Zurich', label: 'Zurich' },
    { value: 'Geneva', label: 'Geneva' },
    { value: 'Basel', label: 'Basel' },
  ],
  Syria: [
    { value: 'Damascus', label: 'Damascus' },
    { value: 'Aleppo', label: 'Aleppo' },
    { value: 'Homs', label: 'Homs' },
  ],
  Thailand: [
    { value: 'Bangkok', label: 'Bangkok' },
    { value: 'Chiang Mai', label: 'Chiang Mai' },
    { value: 'Phuket', label: 'Phuket' },
  ],
  Tunisia: [
    { value: 'Tunis', label: 'Tunis' },
    { value: 'Sfax', label: 'Sfax' },
    { value: 'Sousse', label: 'Sousse' },
  ],
  Turkey: [
    { value: 'Istanbul', label: 'Istanbul' },
    { value: 'Ankara', label: 'Ankara' },
    { value: 'Izmir', label: 'Izmir' },
  ],
  UAE: [
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Sharjah', label: 'Sharjah' },
  ],
  UK: [
    { value: 'London', label: 'London' },
    { value: 'Manchester', label: 'Manchester' },
    { value: 'Birmingham', label: 'Birmingham' },
    { value: 'Liverpool', label: 'Liverpool' },
    { value: 'Edinburgh', label: 'Edinburgh' },
    { value: 'Glasgow', label: 'Glasgow' },
  ],
  USA: [
    { value: 'New York', label: 'New York' },
    { value: 'Los Angeles', label: 'Los Angeles' },
    { value: 'Chicago', label: 'Chicago' },
    { value: 'Houston', label: 'Houston' },
    { value: 'Phoenix', label: 'Phoenix' },
    { value: 'Philadelphia', label: 'Philadelphia' },
    { value: 'San Antonio', label: 'San Antonio' },
    { value: 'San Diego', label: 'San Diego' },
    { value: 'Dallas', label: 'Dallas' },
    { value: 'San Jose', label: 'San Jose' },
  ],
  Yemen: [
    { value: 'Sanaa', label: 'Sanaa' },
    { value: 'Aden', label: 'Aden' },
    { value: 'Taiz', label: 'Taiz' },
  ],
};

const MemberManagement = ({ stats }: MemberManagementProps) => {
    const [filters, setFilters] = useState<{
    search: string;
    gender: string;
    plan: string;
    status: string;
    country: string[];
    city: string[];
    inactiveFor: string;
    hidden: string;
    page: number;
    limit: number;
  }>({
    search: '',
    gender: 'all',
    plan: 'all',
    status: 'all',
    country: [],
    city: [],
    inactiveFor: 'all',
    hidden: 'all',
    page: 1,
    limit: 20
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [userForEmail, setUserForEmail] = useState<any>(null);

  const { users, loading, pagination, refetchData, deleteUser, updateUser, sendPasswordResetLink, sendEmail } = useAdminData(filters);
  const { toast } = useToast();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleMultiSelectChange = (key: 'country' | 'city', selectedOptions: any) => {
    const values = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
    if (key === 'country') {
      setFilters(prev => ({ ...prev, country: values, city: [], page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, city: values, page: 1 }));
    }
  };



  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user and all their associated data? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({ title: 'Success', description: 'User has been successfully deleted.' });
      // refetchData is already called within the deleteUser hook on success
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const renderUserCard = (user: any) => (
    <Card key={user._id} className="mb-4">
      <CardContent className="p-3 sm:p-4">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="flex items-start space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{user.fname} {user.lname}</h3>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant={user.gender === 'male' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                  {user.gender}
                </Badge>
                <Badge variant={isPremiumUser(user) ? 'default' : 'outline'} className="text-xs px-1.5 py-0.5">
                  {getPlanDisplayName(user.plan)}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-xs px-1.5 py-0.5">
                  {user.status}
                </Badge>
                {user.hidden && <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Hidden</Badge>}
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="text-xs text-gray-500">
              {user.age && <span>{user.age} years</span>}
              {user.country && <span> • {user.country}</span>}
            </div>
            <div className="text-xs text-gray-500">
              Matches: {user.matchCount} • Messages: {user.messageCount}
            </div>
            <div className="text-xs text-gray-500">
              {user.lastSeenAgo !== null ? `Last seen ${user.lastSeenAgo}d ago` : 'Never logged in'}
            </div>
          </div>
          
          <div className="flex justify-between gap-2">
            <Link to={`/admin/user/${user._id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full text-xs h-8">
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => {
              setSelectedUser(user);
              setEditDialogOpen(true);
            }}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => {
              setUserForEmail(user);
              setEmailDialogOpen(true);
            }}>
              <Mail className="h-3 w-3 mr-1" />
              Mail
            </Button>
            <Button size="sm" variant="destructive" className="text-xs h-8 px-2" onClick={() => handleDeleteUser(user._id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user.fname} {user.lname}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={user.gender === 'male' ? 'default' : 'secondary'}>
                  {user.gender}
                </Badge>
                <Badge variant={isPremiumUser(user) ? 'default' : 'outline'}>
                  {getPlanDisplayName(user.plan)}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
                {user.hidden && <Badge variant="destructive">Hidden</Badge>}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="text-sm text-gray-500">
              {user.age && <span>{user.age} years old</span>}
              {user.country && <span> • {user.country}</span>}
            </div>
            <div className="text-sm text-gray-500">
              Matches: {user.matchCount} • Messages: {user.messageCount}
            </div>
            <div className="text-sm text-gray-500">
              {user.lastSeenAgo !== null ? `Last seen ${user.lastSeenAgo} days ago` : 'Never logged in'}
            </div>
            
            <div className="flex space-x-2">
              <Link to={`/admin/user/${user._id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>

              <Button size="sm" variant="outline" onClick={() => {
                setSelectedUser(user);
                setEditDialogOpen(true);
              }}>
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button size="sm" variant="outline" onClick={() => {
                setUserForEmail(user);
                setEmailDialogOpen(true);
              }}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.maleMembers || 0} male, {stats?.femaleMembers || 0} female
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.premiumMembers || 0} / {stats?.totalMembers || 0} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hiddenProfiles || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive (6+ months)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inactiveSixMonths || 0}</div>
            <p className="text-xs text-muted-foreground">
              Candidates for removal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Member Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1"
              />
            </div>
            <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.plan} onValueChange={(value) => handleFilterChange('plan', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.inactiveFor} onValueChange={(value) => handleFilterChange('inactiveFor', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Inactive Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="30">1+ month inactive</SelectItem>
                <SelectItem value="90">3+ months inactive</SelectItem>
                <SelectItem value="180">6+ months inactive</SelectItem>
                <SelectItem value="365">12+ months inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.hidden} onValueChange={(value) => handleFilterChange('hidden', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Profile Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                <SelectItem value="false">Visible Profiles</SelectItem>
                <SelectItem value="true">Hidden Profiles</SelectItem>
              </SelectContent>
            </Select>

            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <ReactSelect
                isMulti
                options={countryOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder="Filter by country..."
                onChange={(selected) => handleMultiSelectChange('country', selected)}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    fontSize: '14px'
                  }),
                  multiValue: (base) => ({
                    ...base,
                    fontSize: '12px'
                  })
                }}
              />
            </div>

            {filters.country.length > 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <ReactSelect
                  isMulti
                  options={filters.country.flatMap(country => cityOptions[country] || [])}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Filter by city..."
                  value={(filters.country.flatMap(country => cityOptions[country] || [])).filter(option => filters.city.includes(option.value))}
                  onChange={(selected) => handleMultiSelectChange('city', selected)}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      fontSize: '14px'
                    }),
                    multiValue: (base) => ({
                      ...base,
                      fontSize: '12px'
                    })
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading members...</div>
          ) : (
            <>
              {users.map(renderUserCard)}
              
              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-500 order-first sm:order-none">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>



      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUserUpdate={(userId, data) => {
            updateUser(userId, data);
            setEditDialogOpen(false);
          }}
          sendPasswordReset={sendPasswordResetLink}
        />
      )}

      {userForEmail && (
        <SendEmailDialog
          user={userForEmail}
          isOpen={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          onSendEmail={async (to, subject, message) => {
            await sendEmail({ to, subject, message });
            setEmailDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MemberManagement;
