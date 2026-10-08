export interface Photo {
    id?: string;
    name?: string;
    thumb: string;
    display: string;
    original?: string;
    width?: number;
    height?: number;
    date?: string;
    favorite?: boolean;
}

export interface Section {
    name: string;
    photos: Photo[];
}

export interface Album {
    id: string;
    name: string;
    thumbnail?: string;
    coverImage?: string;
    photoCount?: number;
    sections: Section[];
}

export interface Gallery {
    projectName: string;
    coupleNames?: string;
    coverImage: string;
    albums?: Album[];
    highlights?: Photo[];
    pin?: string | number | null;
    passwordProtected?: boolean;
}
