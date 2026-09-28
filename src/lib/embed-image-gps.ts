import "server-only";
import piexif from "piexifjs";

export type ImageGps = {
	latitude: number;
	longitude: number;
	altitude?: number;
};

export function isJpegImage(format: string | undefined, extension?: string) {
	if (format === "jpeg" || format === "jpg") {
		return true;
	}

	const ext = (extension ?? "").toLowerCase();
	return ext === "jpg" || ext === "jpeg";
}

export function embedGpsInJpegBuffer(buffer: Buffer, gps: ImageGps): Buffer {
	const binary = buffer.toString("binary");
	let exifObj: ReturnType<typeof piexif.load>;

	try {
		exifObj = piexif.load(binary);
	} catch {
		exifObj = { "0th": {}, Exif: {}, GPS: {}, "1st": {} };
	}

	exifObj.GPS ??= {};

	const { latitude, longitude, altitude } = gps;

	exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = latitude >= 0 ? "N" : "S";
	exifObj.GPS[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(latitude));
	exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = longitude >= 0 ? "E" : "W";
	exifObj.GPS[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(longitude));

	if (altitude != null) {
		exifObj.GPS[piexif.GPSIFD.GPSAltitudeRef] = altitude >= 0 ? 0 : 1;
		exifObj.GPS[piexif.GPSIFD.GPSAltitude] = piexif.GPSHelper.degToDmsRational(Math.abs(altitude));
	}

	const exifBytes = piexif.dump(exifObj);
	const updated = piexif.insert(exifBytes, binary);
	return Buffer.from(updated, "binary");
}
