import React from "react";
import {
  BookOpen,
  PenTool,
  Scissors,
  Ruler,
  Search,
  Lightbulb,
  Clock,
  Calculator,
  Globe,
  Microscope,
  FlaskConical,
  Compass,
  GraduationCap,
  ClipboardList,
  Atom,
  Landmark,
  User,
  Users,
  UsersRound,
  Volume2,
  Eye,
  MessageCircle,
  Hand,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Info,
  Target,
  Sun,
  Moon,
  Leaf,
  Trees,
  Droplets,
  Flame,
  Mountain,
  Home,
  Bike,
  TrainFront,
  Plane,
  Laptop,
  Music,
  Camera,
  type LucideIcon,
} from "lucide-react";

export type ShapeCategoryId =
  | "formen"
  | "pfeile"
  | "schule"
  | "methoden"
  | "natur"
  | "figuren";

export interface ShapeCategory {
  id: ShapeCategoryId;
  label: string;
}

export const SHAPE_CATEGORIES: ShapeCategory[] = [
  { id: "formen", label: "Grundformen" },
  { id: "pfeile", label: "Pfeile & Blasen" },
  { id: "schule", label: "Schule & Fach" },
  { id: "methoden", label: "Methoden" },
  { id: "natur", label: "Natur & Alltag" },
  { id: "figuren", label: "Figuren" },
];

export type FloatingItemKind = "shape" | "icon" | "bubble" | "figure";

export interface DecoItemDef {
  id: string;
  category: ShapeCategoryId;
  kind: FloatingItemKind;
  /** Schlüssel für SVG-Form, Icon-Name, Bubble-Typ oder Emoji */
  icon: string;
  label: string;
  color: string;
  keywords?: string[];
}

export interface FloatingSticker {
  id: string;
  sheet: "A" | "B";
  kind: FloatingItemKind;
  icon: string;
  label: string;
  color: string;
  outlineOnly?: boolean;
  x: number;
  y: number;
  yMm: number;
  scale: number;
  rotation: number;
}

export const SHAPE_COLOR_PALETTE = [
  { hex: "#3B38F2", name: "Blau" },
  { hex: "#0F172A", name: "Schwarz" },
  { hex: "#F59E0B", name: "Gelb / Gold" },
  { hex: "#10B981", name: "Grün" },
  { hex: "#EF4444", name: "Rot" },
  { hex: "#EC4899", name: "Pink" },
  { hex: "#0EA5E9", name: "Himmelblau" },
  { hex: "#8B5CF6", name: "Violett" },
];

export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  PenTool,
  Scissors,
  Ruler,
  Search,
  Lightbulb,
  Clock,
  Calculator,
  Globe,
  Microscope,
  FlaskConical,
  Compass,
  GraduationCap,
  ClipboardList,
  Atom,
  Landmark,
  User,
  Users,
  UsersRound,
  Volume2,
  Eye,
  MessageCircle,
  Hand,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Info,
  Target,
  Sun,
  Moon,
  Leaf,
  Trees,
  Droplets,
  Flame,
  Mountain,
  Home,
  Bike,
  TrainFront,
  Plane,
  Laptop,
  Music,
  Camera,
};

export const DECO_ITEMS: DecoItemDef[] = [
  // 1. GRUNDFORMEN (Geometrie & Körper)
  { id: "shape-circle", category: "formen", kind: "shape", icon: "circle", label: "Kreis", color: "#3B38F2", keywords: ["rund", "geometrie"] },
  { id: "shape-oval", category: "formen", kind: "shape", icon: "oval", label: "Oval", color: "#0EA5E9", keywords: ["ellipse", "rund"] },
  { id: "shape-square", category: "formen", kind: "shape", icon: "square", label: "Quadrat", color: "#3B38F2", keywords: ["viereck", "kasten"] },
  { id: "shape-rounded-rect", category: "formen", kind: "shape", icon: "rounded-rect", label: "Rechteck", color: "#8B5CF6", keywords: ["rahmen", "box", "kasten"] },
  { id: "shape-triangle", category: "formen", kind: "shape", icon: "triangle", label: "Dreieck", color: "#10B981", keywords: ["geometrie"] },
  { id: "shape-right-triangle", category: "formen", kind: "shape", icon: "right-triangle", label: "Rechtw. Dreieck", color: "#10B981", keywords: ["pythagoras", "mathe"] },
  { id: "shape-diamond", category: "formen", kind: "shape", icon: "diamond", label: "Raute", color: "#F59E0B", keywords: ["rhombus", "flussdiagramm"] },
  { id: "shape-pentagon", category: "formen", kind: "shape", icon: "pentagon", label: "Fünfeck", color: "#EC4899", keywords: ["polygon", "vieleck"] },
  { id: "shape-hexagon", category: "formen", kind: "shape", icon: "hexagon", label: "Sechseck", color: "#0EA5E9", keywords: ["wabe", "polygon"] },
  { id: "shape-octagon", category: "formen", kind: "shape", icon: "octagon", label: "Achteck", color: "#EF4444", keywords: ["stopp", "polygon"] },
  { id: "shape-trapezoid", category: "formen", kind: "shape", icon: "trapezoid", label: "Trapez", color: "#8B5CF6", keywords: ["geometrie", "mathe"] },
  { id: "shape-parallelogram", category: "formen", kind: "shape", icon: "parallelogram", label: "Parallelogramm", color: "#3B38F2", keywords: ["geometrie", "mathe"] },
  { id: "shape-cube", category: "formen", kind: "shape", icon: "cube", label: "Würfel 3D", color: "#0F172A", keywords: ["körper", "mathe", "volumen"] },
  { id: "shape-cylinder", category: "formen", kind: "shape", icon: "cylinder", label: "Zylinder 3D", color: "#0F172A", keywords: ["körper", "mathe", "dose"] },

  // 2. PFEILE, STERNE & CALLOUT-BLASEN (wie PowerPoint)
  { id: "arrow-right", category: "pfeile", kind: "shape", icon: "arrow-right", label: "Pfeil rechts", color: "#3B38F2", keywords: ["richtung", "weiter", "ablauf"] },
  { id: "arrow-left", category: "pfeile", kind: "shape", icon: "arrow-left", label: "Pfeil links", color: "#3B38F2", keywords: ["richtung", "zurück"] },
  { id: "arrow-up", category: "pfeile", kind: "shape", icon: "arrow-up", label: "Pfeil oben", color: "#10B981", keywords: ["anstieg", "hoch"] },
  { id: "arrow-down", category: "pfeile", kind: "shape", icon: "arrow-down", label: "Pfeil unten", color: "#EF4444", keywords: ["runter", "folge"] },
  { id: "arrow-both", category: "pfeile", kind: "shape", icon: "arrow-both", label: "Doppelpfeil", color: "#8B5CF6", keywords: ["wechselwirkung", "vergleich"] },
  { id: "arrow-curved", category: "pfeile", kind: "shape", icon: "arrow-curved", label: "Bogenpfeil", color: "#0EA5E9", keywords: ["kurve", "verbindung"] },
  { id: "arrow-cycle", category: "pfeile", kind: "shape", icon: "arrow-cycle", label: "Kreislauf", color: "#10B981", keywords: ["zyklus", "prozess", "ökologie"] },
  { id: "shape-star", category: "pfeile", kind: "shape", icon: "star", label: "Stern", color: "#F59E0B", keywords: ["belohnung", "wichtig", "highlight"] },
  { id: "shape-burst", category: "pfeile", kind: "shape", icon: "burst", label: "Siegel / Badge", color: "#8B5CF6", keywords: ["neu", "stempel", "explosion"] },
  { id: "shape-heart", category: "pfeile", kind: "shape", icon: "heart", label: "Herz", color: "#EC4899", keywords: ["liebe", "gefühl"] },
  { id: "shape-cloud", category: "pfeile", kind: "shape", icon: "cloud", label: "Wolke", color: "#0EA5E9", keywords: ["wetter", "gedanke", "brainstorming"] },
  { id: "shape-bolt", category: "pfeile", kind: "shape", icon: "bolt", label: "Blitz", color: "#F59E0B", keywords: ["energie", "strom", "schnell"] },
  { id: "shape-ribbon", category: "pfeile", kind: "shape", icon: "ribbon", label: "Banner", color: "#3B38F2", keywords: ["überschrift", "schleife"] },
  { id: "callout-bubble", category: "pfeile", kind: "bubble", icon: "speech", label: "Tipp!", color: "#3B38F2", keywords: ["sprechblase", "dialog", "text"] },
  { id: "callout-thought", category: "pfeile", kind: "bubble", icon: "thought", label: "Ich denke...", color: "#8B5CF6", keywords: ["gedankenblase", "idee", "text"] },
  { id: "callout-note", category: "pfeile", kind: "bubble", icon: "note", label: "Merke!", color: "#F59E0B", keywords: ["notiz", "zettel", "post-it", "hinweis"] },

  // 3. SCHUL- & FACH-ICONS (PowerPoint-Piktogramme)
  { id: "icon-book", category: "schule", kind: "icon", icon: "BookOpen", label: "Lesen / Buch", color: "#3B38F2", keywords: ["text", "lektüre", "deutsch"] },
  { id: "icon-pen", category: "schule", kind: "icon", icon: "PenTool", label: "Schreiben", color: "#0F172A", keywords: ["stift", "aufsatz", "notieren"] },
  { id: "icon-scissors", category: "schule", kind: "icon", icon: "Scissors", label: "Ausschneiden", color: "#EF4444", keywords: ["schere", "basteln", "zuordnen"] },
  { id: "icon-ruler", category: "schule", kind: "icon", icon: "Ruler", label: "Messen / Lineal", color: "#F59E0B", keywords: ["geometrie", "mathe", "länge"] },
  { id: "icon-search", category: "schule", kind: "icon", icon: "Search", label: "Recherchieren", color: "#0EA5E9", keywords: ["lupe", "untersuchen", "suchen"] },
  { id: "icon-bulb", category: "schule", kind: "icon", icon: "Lightbulb", label: "Idee / Tipp", color: "#F59E0B", keywords: ["glühbirne", "merksatz", "hinweis"] },
  { id: "icon-clock", category: "schule", kind: "icon", icon: "Clock", label: "Zeit / Timer", color: "#3B38F2", keywords: ["uhr", "minuten", "dauer"] },
  { id: "icon-calc", category: "schule", kind: "icon", icon: "Calculator", label: "Rechnen", color: "#0F172A", keywords: ["taschenrechner", "mathe"] },
  { id: "icon-globe", category: "schule", kind: "icon", icon: "Globe", label: "Erdkunde / Welt", color: "#0EA5E9", keywords: ["globus", "geografie", "karte"] },
  { id: "icon-microscope", category: "schule", kind: "icon", icon: "Microscope", label: "Biologie", color: "#10B981", keywords: ["mikroskop", "zelle", "labor"] },
  { id: "icon-flask", category: "schule", kind: "icon", icon: "FlaskConical", label: "Experiment", color: "#8B5CF6", keywords: ["chemie", "versuch", "reagenzglas"] },
  { id: "icon-compass", category: "schule", kind: "icon", icon: "Compass", label: "Kompass", color: "#0EA5E9", keywords: ["navigation", "orientierung", "karte"] },
  { id: "icon-grad", category: "schule", kind: "icon", icon: "GraduationCap", label: "Prüfung / Wissen", color: "#0F172A", keywords: ["abitur", "test", "abschluss"] },
  { id: "icon-checklist", category: "schule", kind: "icon", icon: "ClipboardList", label: "Checkliste", color: "#10B981", keywords: ["aufgaben", "plan", "kontrolle"] },
  { id: "icon-atom", category: "schule", kind: "icon", icon: "Atom", label: "Physik / Atom", color: "#3B38F2", keywords: ["naturwissenschaft", "chemie"] },
  { id: "icon-landmark", category: "schule", kind: "icon", icon: "Landmark", label: "Geschichte", color: "#F59E0B", keywords: ["antike", "politik", "gebäude"] },

  // 4. METHODEN & SOZIALFORM-SYMBOLE (Unterrichts-Piktogramme)
  { id: "icon-single", category: "methoden", kind: "icon", icon: "User", label: "Einzelarbeit", color: "#3B38F2", keywords: ["allein", "sozialform", "person"] },
  { id: "icon-partner", category: "methoden", kind: "icon", icon: "Users", label: "Partnerarbeit", color: "#8B5CF6", keywords: ["tandem", "zweit", "sozialform"] },
  { id: "icon-group", category: "methoden", kind: "icon", icon: "UsersRound", label: "Gruppenarbeit", color: "#10B981", keywords: ["team", "plenum", "sozialform"] },
  { id: "icon-audio", category: "methoden", kind: "icon", icon: "Volume2", label: "Hören / Audio", color: "#0EA5E9", keywords: ["lautsprecher", "hörverstehen"] },
  { id: "icon-eye", category: "methoden", kind: "icon", icon: "Eye", label: "Beobachten", color: "#0F172A", keywords: ["auge", "anschauen", "bild"] },
  { id: "icon-discuss", category: "methoden", kind: "icon", icon: "MessageCircle", label: "Diskutieren", color: "#3B38F2", keywords: ["sprechen", "austausch", "gespräch"] },
  { id: "icon-hand", category: "methoden", kind: "icon", icon: "Hand", label: "Stopp / Melden", color: "#EF4444", keywords: ["pause", "achtung", "regel"] },
  { id: "icon-help", category: "methoden", kind: "icon", icon: "HelpCircle", label: "Frage", color: "#8B5CF6", keywords: ["fragezeichen", "rätsel"] },
  { id: "icon-alert", category: "methoden", kind: "icon", icon: "AlertTriangle", label: "Achtung", color: "#F59E0B", keywords: ["warnung", "wichtig", "gefahr"] },
  { id: "icon-check", category: "methoden", kind: "icon", icon: "CheckCircle2", label: "Richtig / OK", color: "#10B981", keywords: ["haken", "lösung", "fertig"] },
  { id: "icon-wrong", category: "methoden", kind: "icon", icon: "XCircle", label: "Falsch", color: "#EF4444", keywords: ["kreuz", "fehler"] },
  { id: "icon-thumbs", category: "methoden", kind: "icon", icon: "ThumbsUp", label: "Gut gemacht", color: "#10B981", keywords: ["lob", "daumen", "prima"] },
  { id: "icon-info", category: "methoden", kind: "icon", icon: "Info", label: "Hinweis / Info", color: "#0EA5E9", keywords: ["information", "merke"] },
  { id: "icon-target", category: "methoden", kind: "icon", icon: "Target", label: "Lernziel", color: "#EF4444", keywords: ["ziel", "fokus", "kompetenz"] },

  // 5. NATUR, TECHNIK & ALLTAG (PowerPoint-Icons)
  { id: "icon-sun", category: "natur", kind: "icon", icon: "Sun", label: "Sonne", color: "#F59E0B", keywords: ["wetter", "sommer", "energie"] },
  { id: "icon-moon", category: "natur", kind: "icon", icon: "Moon", label: "Mond", color: "#8B5CF6", keywords: ["nacht", "astronomie"] },
  { id: "icon-leaf", category: "natur", kind: "icon", icon: "Leaf", label: "Pflanze", color: "#10B981", keywords: ["blatt", "natur", "umwelt"] },
  { id: "icon-trees", category: "natur", kind: "icon", icon: "Trees", label: "Wald", color: "#10B981", keywords: ["baum", "ökosystem", "natur"] },
  { id: "icon-water", category: "natur", kind: "icon", icon: "Droplets", label: "Wasser", color: "#0EA5E9", keywords: ["tropfen", "regen", "kreislauf"] },
  { id: "icon-flame", category: "natur", kind: "icon", icon: "Flame", label: "Feuer / Wärme", color: "#EF4444", keywords: ["flamme", "energie", "chemie"] },
  { id: "icon-mountain", category: "natur", kind: "icon", icon: "Mountain", label: "Gebirge", color: "#0F172A", keywords: ["berg", "landschaft", "geografie"] },
  { id: "icon-home", category: "natur", kind: "icon", icon: "Home", label: "Haus / Alltag", color: "#3B38F2", keywords: ["wohnen", "familie", "hausaufgabe"] },
  { id: "icon-bike", category: "natur", kind: "icon", icon: "Bike", label: "Fahrrad", color: "#10B981", keywords: ["verkehr", "mobilität", "sport"] },
  { id: "icon-train", category: "natur", kind: "icon", icon: "TrainFront", label: "Zug / ÖPNV", color: "#3B38F2", keywords: ["verkehr", "eisenbahn", "reise"] },
  { id: "icon-plane", category: "natur", kind: "icon", icon: "Plane", label: "Flugzeug", color: "#0EA5E9", keywords: ["reisen", "urlaub", "klima"] },
  { id: "icon-laptop", category: "natur", kind: "icon", icon: "Laptop", label: "Digital / PC", color: "#0F172A", keywords: ["computer", "medien", "informatik"] },
  { id: "icon-music", category: "natur", kind: "icon", icon: "Music", label: "Musik", color: "#EC4899", keywords: ["note", "lied", "kunst"] },
  { id: "icon-camera", category: "natur", kind: "icon", icon: "Camera", label: "Foto / Medien", color: "#8B5CF6", keywords: ["kamera", "bild", "kunst"] },

  // 6. FIGUREN & GRUNDSCHUL-STICKER
  { id: "fig-owl", category: "figuren", kind: "figure", icon: "🦉", label: "Eule", color: "#3B38F2", keywords: ["tier", "schlau", "grundschule"] },
  { id: "fig-fox", category: "figuren", kind: "figure", icon: "🦊", label: "Fuchs", color: "#F59E0B", keywords: ["tier", "wald", "grundschule"] },
  { id: "fig-rocket", category: "figuren", kind: "figure", icon: "🚀", label: "Rakete", color: "#3B38F2", keywords: ["weltraum", "start", "motivation"] },
  { id: "fig-robot", category: "figuren", kind: "figure", icon: "🤖", label: "Roboter", color: "#0F172A", keywords: ["technik", "ki", "informatik"] },
  { id: "fig-dino", category: "figuren", kind: "figure", icon: "🦕", label: "Dino", color: "#10B981", keywords: ["tier", "grundschule"] },
  { id: "fig-bee", category: "figuren", kind: "figure", icon: "🐝", label: "Biene", color: "#F59E0B", keywords: ["fleißig", "natur", "grundschule"] },
  { id: "fig-dog", category: "figuren", kind: "figure", icon: "🐶", label: "Hund", color: "#F59E0B", keywords: ["tier", "haustier"] },
  { id: "fig-cat", category: "figuren", kind: "figure", icon: "🐱", label: "Katze", color: "#EC4899", keywords: ["tier", "haustier"] },
  { id: "fig-pencil", category: "figuren", kind: "figure", icon: "✏️", label: "Bleistift", color: "#F59E0B", keywords: ["schreiben", "schule"] },
  { id: "fig-trophy", category: "figuren", kind: "figure", icon: "🏆", label: "Pokal", color: "#F59E0B", keywords: ["gewinner", "belohnung"] },
  { id: "fig-medal", category: "figuren", kind: "figure", icon: "🏅", label: "Medaille", color: "#F59E0B", keywords: ["auszeichnung", "lob"] },
  { id: "fig-crown", category: "figuren", kind: "figure", icon: "👑", label: "Krone", color: "#F59E0B", keywords: ["könig", "experte"] },
  { id: "fig-rainbow", category: "figuren", kind: "figure", icon: "🌈", label: "Regenbogen", color: "#0EA5E9", keywords: ["wetter", "farben", "grundschule"] },
  { id: "fig-clover", category: "figuren", kind: "figure", icon: "🍀", label: "Glücksklee", color: "#10B981", keywords: ["glück", "prüfung", "viel erfolg"] },
];

export function renderShapeSvg(
  icon: string,
  color: string,
  sizeClass = "w-16 h-16",
  outlineOnly = false
): React.ReactNode {
  const fill = outlineOnly ? "none" : color + "24";
  const softFill = outlineOnly ? "none" : color + "16";
  const strokeWidth = 3.2;

  switch (icon) {
    case "circle":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <circle cx="40" cy="40" r="32" fill={fill} stroke={color} strokeWidth={strokeWidth} />
        </svg>
      );
    case "oval":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <ellipse cx="48" cy="32" rx="40" ry="24" fill={fill} stroke={color} strokeWidth={strokeWidth} />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <rect x="10" y="10" width="60" height="60" rx="2" fill={fill} stroke={color} strokeWidth={strokeWidth} />
        </svg>
      );
    case "rounded-rect":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <rect x="8" y="10" width="80" height="44" rx="12" fill={fill} stroke={color} strokeWidth={strokeWidth} />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="40,9 73,68 7,68" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "right-triangle":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="12,12 12,68 70,68" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <path d="M12 56 H24 V68" fill="none" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="40,7 73,40 40,73 7,40" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "pentagon":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="40,8 72,31 60,70 20,70 8,31" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "hexagon":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="40,7 69,23 69,57 40,73 11,57 11,23" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "octagon":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="27,8 53,8 72,27 72,53 53,72 27,72 8,53 8,27" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "trapezoid":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <polygon points="24,12 72,12 88,52 8,52" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "parallelogram":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <polygon points="24,12 88,12 72,52 8,52" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "cube":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="40,8 70,23 70,57 40,72 10,57 10,23" fill={softFill} stroke={color} strokeWidth="2.8" strokeLinejoin="round" />
          <polyline points="10,23 40,38 70,23" fill="none" stroke={color} strokeWidth="2.8" strokeLinejoin="round" />
          <line x1="40" y1="38" x2="40" y2="72" stroke={color} strokeWidth="2.8" />
        </svg>
      );
    case "cylinder":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <path d="M16,20 V60 C16,66.6 26.7,72 40,72 C53.3,72 64,66.6 64,60 V20" fill={softFill} stroke={color} strokeWidth="2.8" />
          <ellipse cx="40" cy="20" rx="24" ry="10" fill={fill} stroke={color} strokeWidth="2.8" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <polygon points="8,22 56,22 56,10 88,32 56,54 56,42 8,42" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <polygon points="88,22 40,22 40,10 8,32 40,54 40,42 88,42" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg viewBox="0 0 64 96" className={sizeClass === "w-16 h-16" ? "w-14 h-20" : sizeClass}>
          <polygon points="22,88 22,40 10,40 32,8 54,40 42,40 42,88" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg viewBox="0 0 64 96" className={sizeClass === "w-16 h-16" ? "w-14 h-20" : sizeClass}>
          <polygon points="22,8 22,56 10,56 32,88 54,56 42,56 42,8" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "arrow-both":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <polygon points="8,32 30,12 30,23 66,23 66,12 88,32 66,52 66,41 30,41 30,52" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "arrow-curved":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <path d="M12,48 C22,14 62,14 74,34" fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
          <polygon points="82,42 64,38 78,24" fill={color} />
        </svg>
      );
    case "arrow-cycle":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <path d="M40,12 A28,28 0 0,1 66,30" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <polygon points="69,37 59,28 71,24" fill={color} />
          <path d="M64,54 A28,28 0 0,1 22,61" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <polygon points="16,56 28,56 21,67" fill={color} />
          <path d="M14,44 A28,28 0 0,1 32,14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <polygon points="39,12 30,20 28,8" fill={color} />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <path
            d="M40 68 C40 68 10 49 10 27 C10 16 19 9 28 9 C34 9 38 13 40 17 C42 13 46 9 52 9 C61 9 70 16 70 27 C70 49 40 68 40 68 Z"
            fill={fill}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 96 64" className={sizeClass === "w-16 h-16" ? "w-20 h-14" : sizeClass}>
          <path
            d="M24 52 H72 C81 52 88 45 88 36 C88 28 82 21 74 20 C71 11 62 6 52 6 C41 6 32 13 30 23 C28 22 26 22 24 22 C15 22 8 29 8 37 C8 45 15 52 24 52 Z"
            fill={outlineOnly ? "none" : "#FFFFFF"}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon points="46,6 16,44 38,44 32,74 64,34 42,34" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case "ribbon":
      return (
        <svg viewBox="0 0 112 56" className={sizeClass === "w-16 h-16" ? "w-24 h-12" : sizeClass}>
          <polygon points="6,14 24,14 24,46 6,46 14,30" fill={softFill} stroke={color} strokeWidth="2.8" strokeLinejoin="round" />
          <polygon points="106,14 88,14 88,46 106,46 98,30" fill={softFill} stroke={color} strokeWidth="2.8" strokeLinejoin="round" />
          <rect x="20" y="8" width="72" height="34" rx="4" fill={fill} stroke={color} strokeWidth="3" />
        </svg>
      );
    case "burst":
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon
            points="40,4 48,15 62,10 64,24 76,30 69,42 76,54 63,59 61,73 48,68 40,78 32,68 19,73 17,59 4,54 11,42 4,30 16,24 18,10 32,15"
            fill={fill}
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "star":
    default:
      return (
        <svg viewBox="0 0 80 80" className={sizeClass}>
          <polygon
            points="40,6 49,29 74,29 54,44 61,68 40,53 19,68 26,44 6,29 31,29"
            fill={fill}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function renderDecoPreview(item: DecoItemDef): React.ReactNode {
  if (item.kind === "figure") {
    return <span className="text-xl leading-none">{item.icon}</span>;
  }
  if (item.kind === "icon") {
    const IconComp = LUCIDE_ICON_MAP[item.icon] || Lightbulb;
    return <IconComp className="w-5 h-5" style={{ color: item.color }} strokeWidth={2} />;
  }
  if (item.kind === "bubble") {
    if (item.icon === "thought") {
      return (
        <svg viewBox="0 0 40 32" className="w-6 h-5">
          <path d="M12 22 H28 C33 22 36 19 36 15 C36 11 33 8 29 8 C27 4 22 2 17 4 C13 4 10 7 9 11 C6 11 4 14 4 17 C4 20 7 22 12 22 Z" fill="#fff" stroke={item.color} strokeWidth="2.2" />
          <circle cx="11" cy="27" r="2" fill={item.color} />
          <circle cx="7" cy="30" r="1.3" fill={item.color} />
        </svg>
      );
    }
    if (item.icon === "note") {
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M5 4 H27 V22 L21 28 H5 Z" fill="#FEF3C7" stroke={item.color} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M21 28 V22 H27" fill="none" stroke={item.color} strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 40 32" className="w-6 h-5">
        <rect x="4" y="4" width="32" height="19" rx="7" fill="#fff" stroke={item.color} strokeWidth="2.2" />
        <polygon points="14,23 19,29 22,23" fill="#fff" stroke={item.color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return renderShapeSvg(item.icon, item.color, "w-5 h-5", false);
}
