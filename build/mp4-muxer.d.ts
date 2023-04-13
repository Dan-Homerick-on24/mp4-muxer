/**
 * Describes the properties used to configure an instance of `Muxer`.
 */
declare interface MuxerOptions<T extends Target> {
	/**
	 * Specifies what happens with the data created by the muxer.
	 */
	target: T,

	/**
	 * When set, declares the existence of a video track in the MP4 file and configures that video track.
	 */
	video?: {
		/**
		 * The codec of the encoded video chunks.
		 */
		codec: 'avc' | 'hevc',
		/**
		 * The width of the video, in pixels.
		 */
		width: number,
		/**
		 * The height of the video, in pixels.
		 */
		height: number
	},

	/**
	 * When set, declares the existence of an audio track in the MP4 file and configures that audio track.
	 */
	audio?: {
		/**
		 * The codec of the encoded audio chunks.
		 */
		codec: 'aac',
		/**
		 * The number of audio channels in the audio track.
		 */
		numberOfChannels: number,
		/**
		 * The sample rate in the audio rate, in samples per second per channel.
		 */
		sampleRate: number
	},

	/**
	 * Specifies how to deal with the first chunk in each track having a non-zero timestamp. In the default strict mode,
	 * timestamps must start with 0 to ensure proper playback. However, when directly piping video frames or audio data
	 * from a MediaTrackStream into the encoder and then the muxer, the timestamps are usually relative to the age of
	 * the document or the computer's clock, which is typically not what we want. Handling of these timestamps must be
	 * set explicitly:
	 *
	 * Use `'offset'` to offset the timestamp of each video track by that track's first chunk's timestamp. This way, it
	 * starts at 0.
	 *
	 * Use `'permissive'` to allow the first timestamp to be non-zero.
	 */
	firstTimestampBehavior?: 'strict' | 'offset' | 'permissive'
}

declare type Target = ArrayBufferTarget | StreamTarget | FileSystemWritableFileStreamTarget;

declare class ArrayBufferTarget {
	buffer: ArrayBuffer;
}

declare class StreamTarget {
	constructor(
		onData: (data: Uint8Array, position: number) => void,
		onDone?: () => void,
		options?: { chunked: true }
	);
}

declare class FileSystemWritableFileStreamTarget {
	constructor(stream: FileSystemWritableFileStream);
}

/**
 * Used to multiplex video and audio chunks into a single MP4 file. For each MP4 file you want to create, create
 * one instance of `Muxer`.
 */
declare class Muxer<T extends Target> {
	target: T;

	/**
	 * Creates a new instance of `Muxer`.
	 * @param options Specifies configuration and metadata for the MP4 file.
	 */
	constructor(options: MuxerOptions<T>);

	/**
	 * Adds a new, encoded video chunk to the MP4 file.
	 * @param chunk The encoded video chunk. Can be obtained through a `VideoEncoder`.
	 * @param meta The metadata about the encoded video, also provided by `VideoEncoder`.
	 * @param timestamp Optionally, the timestamp to use for the video chunk. When not provided, it will use the one
	 * specified in `chunk`.
	 */
	addVideoChunk(chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata, timestamp?: number): void;
	/**
	 * Adds a new, encoded audio chunk to the MP4 file.
	 * @param chunk The encoded audio chunk. Can be obtained through an `AudioEncoder`.
	 * @param meta The metadata about the encoded audio, also provided by `AudioEncoder`.
	 * @param timestamp Optionally, the timestamp to use for the audio chunk. When not provided, it will use the one
	 * specified in `chunk`.
	 */
	addAudioChunk(chunk: EncodedAudioChunk, meta: EncodedAudioChunkMetadata, timestamp?: number): void;

	/**
	 * Adds a raw video chunk to the MP4 file. This method should be used when the encoded video is not obtained
	 * through a `VideoEncoder` but through some other means, where no instance of `EncodedVideoChunk`is available.
	 * @param data The raw data of the video chunk.
	 * @param type Whether the video chunk is a keyframe or delta frame.
	 * @param timestamp The timestamp of the video chunk.
	 * @param duration The duration of the video chunk (typically 0).
	 * @param meta Optionally, any encoder metadata.
	 */
	addVideoChunkRaw(
		data: Uint8Array,
		type: 'key' | 'delta',
		timestamp: number,
		duration: number,
		meta?: EncodedVideoChunkMetadata
	): void;
	/**
	 * Adds a raw audio chunk to the MP4 file. This method should be used when the encoded audio is not obtained
	 * through an `AudioEncoder` but through some other means, where no instance of `EncodedAudioChunk`is available.
	 * @param data The raw data of the audio chunk.
	 * @param type Whether the audio chunk is a keyframe or delta frame.
	 * @param timestamp The timestamp of the audio chunk.
	 * @param duration The duration of the audio chunk.
	 * @param meta Optionally, any encoder metadata.
	 */
	addAudioChunkRaw(
		data: Uint8Array,
		type: 'key' | 'delta',
		timestamp: number,
		duration: number,
		meta?: EncodedAudioChunkMetadata
	): void;

	/**
	 * Is to be called after all media chunks have been added to the muxer. Make sure to call and await the `flush`
	 * method on your `VideoEncoder` and/or `AudioEncoder` before calling this method to ensure all encoding has
	 * finished. This method will then finish up the writing process of the MP4 file.
	 * @returns Should you have used `target: 'buffer'` in the configuration options, this method will return the
	 * buffer containing the final MP4 file.
	 */
	finalize(): ArrayBuffer | null;
}

declare namespace Mp4Muxer {
	export { Muxer, ArrayBufferTarget, StreamTarget, FileSystemWritableFileStreamTarget };
}

declare global {
	let Mp4Muxer: typeof Mp4Muxer;
}

export { Muxer, ArrayBufferTarget, StreamTarget, FileSystemWritableFileStreamTarget };
export as namespace Mp4Muxer;
export default Mp4Muxer;