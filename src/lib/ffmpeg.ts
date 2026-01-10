import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH as string);
